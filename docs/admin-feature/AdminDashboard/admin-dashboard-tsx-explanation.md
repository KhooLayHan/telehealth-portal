# AdminDashboard.tsx Code Flow Explanation

## Short Version
`AdminDashboard.tsx` is the admin home dashboard UI. It polls three backend admin endpoints every second to show: (1) summary stat cards, (2) a weekly clinic activity chart, and (3) recent audit logs. It keeps the UI resilient by checking HTTP status values from generated API hooks and showing clear fallback messages when loading fails or data is missing.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/dashboard/roles/AdminDashboard.tsx` | Main component and UI logic for stats, chart, and audit table. |
| `frontend/src/api/generated/admins/admins.ts` | Generated TanStack Query hooks and endpoint URLs used by the dashboard. |

## Technical Flow
1. `AdminDashboard` starts by calling three generated hooks:
   - `useAdminGetDashboardSummary`
   - `useAdminGetClinicActivity`
   - `useAdminGetAuditLogs({ Page: 1, PageSize: 5 })`
2. Each hook is configured with `refetchInterval: 1000`, so the dashboard auto-refreshes once per second.
3. The component only trusts successful payloads when `response.status === 200`.
   - Summary falls back to `null` on non-200.
   - Audit logs fall back to an empty array on non-200.
   - Clinic activity falls back to an empty array on non-200.
4. UI sections are rendered independently:
   - **Stat cards** show `Loading`, `Unavailable`, or formatted numbers.
   - **Clinic activity chart** shows a chart or a status message.
   - **Audit logs table** shows rows or one row with loading/error/empty text.
5. Helper functions keep display formatting clean and privacy-aware:
   - `formatAuditPublicId` shows only first 8 chars.
   - `getAuditActorLabel` avoids exposing sensitive user data and prints `System`, `Unknown`, or short public ID label.
   - `formatAuditTimestamp` safely handles invalid date values.

## Frontend Code
From `frontend/src/features/dashboard/roles/AdminDashboard.tsx`:

```tsx
const dashboardSummaryQuery = useAdminGetDashboardSummary({
  query: { refetchInterval: ADMIN_DASHBOARD_REFETCH_INTERVAL_MS },
});
const clinicActivityQuery = useAdminGetClinicActivity({
  query: { refetchInterval: ADMIN_DASHBOARD_REFETCH_INTERVAL_MS },
});
const auditLogsQuery = useAdminGetAuditLogs(
  { Page: 1, PageSize: 5 },
  { query: { refetchInterval: ADMIN_DASHBOARD_REFETCH_INTERVAL_MS } },
);
```
These are generated TanStack Query hooks. They fetch the API and keep query state (`isLoading`, `isError`, `data`) updated automatically.

From `frontend/src/features/dashboard/roles/AdminDashboard.tsx`:

```tsx
const dashboardSummary =
  dashboardSummaryQuery.data?.status === 200 ? dashboardSummaryQuery.data.data : null;
```
This pattern is important in this project because generated clients return a response object with both `status` and `data`. The component explicitly checks `status` before trusting data.

From `frontend/src/features/dashboard/roles/AdminDashboard.tsx`:

```tsx
function getAuditActorLabel(entry: AdminAuditLogDto): string {
  if (entry.performedBySystem) return "System";

  return entry.performedByUserPublicId === null
    ? "Unknown"
    : `User ${formatAuditPublicId(entry.performedByUserPublicId)}`;
}
```
This keeps actor rendering concise and avoids exposing full identifiers in the table.

From `frontend/src/features/dashboard/roles/AdminDashboard.tsx`:

```tsx
const message = isLoading
  ? "Loading audit logs"
  : isError
    ? "Audit logs unavailable"
    : "No audit logs found";
```
The table always shows user-friendly feedback when there are no rows.

## Backend Code (as traced from generated frontend client)
From `frontend/src/api/generated/admins/admins.ts`:

```ts
return `/api/v1/admins/dashboard-summary`
return `/api/v1/admins/clinic-activity`
return stringifiedParams.length > 0
  ? `/api/v1/admins/audit-logs?${stringifiedParams}`
  : `/api/v1/admins/audit-logs`
```
These are the exact backend routes this dashboard depends on.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
const queryFn: QueryFunction<Awaited<ReturnType<typeof adminGetDashboardSummary>>> =
  ({ signal }) => adminGetDashboardSummary({ signal, ...requestOptions });
```
Generated hooks wrap low-level HTTP functions and connect them to TanStack Query caching and refetch behavior.

> Note: This explanation traces backend interaction through generated API client code. The actual backend endpoint handler/validator files were not required to explain `AdminDashboard.tsx` itself and were not additionally expanded here.

## End-to-End Code Flow
1. Admin user opens dashboard page.
2. `AdminDashboard` mounts and starts 3 polling queries.
3. Generated hooks call `/api/v1/admins/dashboard-summary`, `/api/v1/admins/clinic-activity`, and `/api/v1/admins/audit-logs?Page=1&PageSize=5`.
4. Query state updates (`isLoading`, `isError`, `data`) drive conditional rendering.
5. Stats become cards with icons and formatted counts.
6. Clinic activity data becomes an `AreaChart` with custom tooltip.
7. Audit log DTOs become rows in a TanStack React Table with action badges and compact IDs.

## Important Details
- Polling interval is very aggressive (`1000ms`); this favors freshness over network cost.
- Status checks are strict (`status === 200`) so UI fails safely if backend returns non-success codes.
- Audit table uses `row.publicId` as stable row IDs.
- `changedColumns` empty state shows `Full row`, helping admins interpret complete updates/deletes.
- Timestamp formatter returns `--` on invalid date input instead of throwing.

## Beginner Programmer Notes
- **Generated hook**: a prebuilt function (from OpenAPI) that already knows URL, method, and response type.
- **TanStack Query**: manages server state (loading/error/data), caching, and background refetching.
- **TanStack Table**: helps define columns and cell rendering in a structured way.
- **DTO**: a typed data shape coming from the backend API response.
