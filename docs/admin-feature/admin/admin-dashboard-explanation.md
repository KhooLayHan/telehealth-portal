# Admin Dashboard Component (Plain English Explanation)

## Short Version
`AdminDashboard.tsx` builds the admin home dashboard view in the frontend. It asks the backend for three datasets every second: summary counts, clinic activity, and recent audit logs. It then shows this data as stat cards, a line/area chart, and a table, while gracefully handling loading, empty, and error states.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/dashboard/roles/AdminDashboard.tsx` | Contains the full UI, data fetching, formatting helpers, and render flow for the admin dashboard. |

## What Happens
1. The component starts by calling three generated API hooks:
   - `useAdminGetDashboardSummary`
   - `useAdminGetClinicActivity`
   - `useAdminGetAuditLogs`
2. All three hooks are configured to refetch every 1,000 ms, so the dashboard stays near real-time.
3. Returned responses are checked for HTTP `200` before using data.
4. Small helper functions format values safely:
   - Missing numbers become `--`
   - Timestamps are converted to a readable local string
   - Actor labels in audit rows avoid PII and show compact public IDs
5. The UI renders in three major sections:
   - Top stat cards for appointments/patients/doctors/staff
   - Clinic activity chart (or a fallback message)
   - Recent system audit table (or a fallback message)

## Important Code Snippets
From `frontend/src/features/dashboard/roles/AdminDashboard.tsx`:

```tsx
const ADMIN_DASHBOARD_REFETCH_INTERVAL_MS = 1_000;
```
This keeps all dashboard API queries polling every second.

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
These are the three backend data sources used by the dashboard.

```tsx
const dashboardSummary =
  dashboardSummaryQuery.data?.status === 200 ? dashboardSummaryQuery.data.data : null;
```
This pattern is used repeatedly to avoid rendering invalid/non-200 payloads.

```tsx
function getAuditActorLabel(entry: AdminAuditLogDto): string {
  if (entry.performedBySystem) return "System";
  return entry.performedByUserPublicId === null
    ? "Unknown"
    : `User ${formatAuditPublicId(entry.performedByUserPublicId)}`;
}
```
Audit rows only show `System`, `Unknown`, or a shortened public ID-based label.

```tsx
<AuditLogsTable
  data={auditLogs}
  isError={auditLogsUnavailable}
  isLoading={auditLogsQuery.isLoading}
/>
```
The table rendering is delegated to a reusable child component with explicit state props.

## Code Flow
1. **Page loads** and `AdminDashboard` mounts.
2. **Frontend fetches data** from three admin endpoints using generated hooks.
3. **Component normalizes data** (status checks, number conversion, timestamp formatting).
4. **Stat cards render** summary counts with loading/error text as needed.
5. **Chart area renders** clinic activity if present; otherwise it shows a human-readable fallback message.
6. **Audit table renders** recent audit logs with badges and compact identifiers.
7. **Polling repeats every second**, refreshing the visible data.

## Important Details
- Audit log rows are keyed by `publicId`, not a fragile array index.
- Changed-column chips display `Full row` when the backend does not provide changed fields.
- The chart tooltip is custom and only appears when data is valid.
- All user-visible fallback messages are explicit (`Loading...`, `Unavailable`, `No ... found`) to avoid blank UI states.

## In Everyday Words
This file is the admin “control panel” screen. It keeps checking the backend every second, then shows key clinic numbers, a weekly appointment trend chart, and a short feed of recent system changes in one place.
