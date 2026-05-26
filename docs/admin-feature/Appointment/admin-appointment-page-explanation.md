# Admin Appointment Page (`AdminAppointmentPage.tsx`) — Technical Explanation

## Short Version
`AdminAppointmentPage` is the admin/receptionist scheduling screen that lets users switch between a calendar overview and a paginated appointment list, with search, status filters, a "today only" toggle, and CSV export. It is mostly a UI orchestrator: it keeps local view/filter state, then delegates data loading to `useAdminAppointments` and CSV generation to `useAppointmentsCsvExport`. The data comes from generated Orval API hooks/functions that call backend endpoints under `/api/v1/appointments` and `/api/v1/appointments/statuses`. Backend authorization and filtering logic are enforced in the .NET appointment endpoints and handlers.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminAppointmentPage.tsx` | Main page component; owns view mode, date/list/filter/search state and wires child components. |
| `frontend/src/features/admins/manageAppointments/UseAdminAppointments.tsx` | Custom hook that fetches month/list appointment data and status options via generated hooks. |
| `frontend/src/features/admins/manageAppointments/UseAppointmentsCsvExport.tsx` | CSV export flow: paginated fetch loop, CSV escaping, file download, and toasts. |
| `frontend/src/features/admins/manageAppointments/AppointmentCalendar.tsx` | Calendar UI and "Upcoming Today" panel for day/month visualization. |
| `frontend/src/features/admins/manageAppointments/AppointmentTable.tsx` | List view table with pagination and status badge rendering. |
| `frontend/src/api/generated/appointments/appointments.ts` | Generated client/hook layer that calls `/api/v1/appointments` and `/api/v1/appointments/statuses`. |
| `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistEndpoint.cs` | Backend route mapping and policy requirement for appointment listing. |
| `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistHandler.cs` | Backend query/filter/sort/pagination logic and DTO projection. |
| `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistQuery.cs` | Query parameter contract for list endpoint (`View`, `Status`, `Search`, date range, page, sort). |
| `backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentStatuses/GetAppointmentStatusesEndpoint.cs` | Backend route mapping for status list. |
| `backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentStatuses/GetAppointmentStatusesHandler.cs` | Returns appointment statuses used by the filter pills. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Canonical route constants used by endpoint mapping (`appointments`, `appointments/statuses`). |

## Technical Flow
1. The page initializes UI state (`viewMode`, month/year/day, list page, search text, status filter, todayOnly toggle).
2. It calls `useAdminAppointments(...)` with those values. That hook runs:
   - a month-range query for calendar dots + "today" panel,
   - a separate paginated list query for table mode,
   - a status query for filter buttons.
3. In calendar mode, `AppointmentCalendar` receives `scheduledDays`, `monthItems`, `todayAppointments`, and month navigation callbacks.
4. In list mode, `AppointmentTable` receives paginated `listItems`, loading state, and pagination callbacks.
5. Search and filters reset list page back to 1 to avoid invalid pages after criteria changes.
6. CSV export triggers `useAppointmentsCsvExport`, which repeatedly fetches `/api/v1/appointments` page-by-page (size 50) until `hasNextPage` is false, then downloads a CSV.
7. Backend endpoint/handler enforces authorization, applies filters (`Status`, `Search`, date range, etc.), sorts, paginates, and returns `PagedResult<ReceptionistAppointmentDto>`.

## Frontend Code
From `frontend/src/features/admins/AdminAppointmentPage.tsx`:
```tsx
const {
  monthItems,
  scheduledDays,
  todayAppointments,
  isMonthLoading,
  listItems,
  listTotalPages,
  isListLoading,
  statuses,
} = useAdminAppointments(
  currentYear,
  currentMonth,
  listPage,
  search,
  {
    status: statusFilter,
    todayOnly,
  },
  viewMode === "calendar",
  viewMode === "list",
);
```
This is the page’s main data boundary. Instead of fetching directly, the component passes UI state into one hook and gets back view-ready data for both calendar and list modes.

From `frontend/src/features/admins/manageAppointments/UseAdminAppointments.tsx`:
```tsx
const monthQuery = useGetAllAppointmentsForReceptionist(
  {
    From: firstOfMonth,
    To: lastOfMonth,
    PageSize: 50,
    SortOrder: "asc",
  },
  {
    query: {
      refetchInterval: shouldPollCalendar ? APPOINTMENT_REFETCH_INTERVAL_MS : false,
    },
  },
);
```
This fetches month data used for calendar dots and today panel. It polls every second only when calendar mode is active.

From `frontend/src/features/admins/manageAppointments/UseAdminAppointments.tsx`:
```tsx
const listQuery = useGetAllAppointmentsForReceptionist(
  {
    PageSize: 5,
    Page: listPage,
    SortOrder: "asc",
    ...(search.trim() ? { Search: search.trim() } : {}),
    ...(filters.status ? { Status: filters.status } : {}),
    ...(filters.todayOnly ? { From: todayIso, To: todayIso } : {}),
  },
  {
    query: {
      refetchInterval: shouldPollList ? APPOINTMENT_REFETCH_INTERVAL_MS : false,
    },
  },
);
```
This is the list-mode query. It conditionally adds query params so the backend receives only active filters.

From `frontend/src/features/admins/manageAppointments/UseAppointmentsCsvExport.tsx`:
```tsx
while (hasNextPage) {
  const response = await getAllAppointmentsForReceptionist({
    Page: page,
    PageSize: APPOINTMENTS_EXPORT_PAGE_SIZE,
    SortOrder: "asc",
  });

  if (response.status !== 200) {
    toast.error("Failed to export appointments.");
    return;
  }

  appointments.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```
CSV export is intentionally independent from React Query cache; it performs a full server walk so exported data is complete.

From `frontend/src/api/generated/appointments/appointments.ts`:
```ts
return stringifiedParams.length > 0 ? `/api/v1/appointments?${stringifiedParams}` : `/api/v1/appointments`
```
Generated code confirms the frontend hook/function target endpoint.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistEndpoint.cs`:
```csharp
group
    .MapGet(
        ApiEndpoints.Appointments.GetAllAppointments,
        async Task<Ok<PagedResult<ReceptionistAppointmentDto>>> (
            [AsParameters] GetAllAppointmentsForReceptionistQuery query,
            GetAllAppointmentsForReceptionistHandler handler,
            CancellationToken ct
        ) =>
        {
            var appointments = await handler.HandleAsync(query, ct);
            return TypedResults.Ok(appointments);
        }
    )
    .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy);
```
This maps `GET /api/v1/appointments`, binds query-string values into a typed query object, and restricts access to admin/receptionist roles.

From `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistHandler.cs`:
```csharp
if (!string.IsNullOrWhiteSpace(query.Search))
{
    var pattern = $"%{query.Search}%";
    q = q.Where(a =>
        EF.Functions.ILike(a.Doctor.User.FirstName + " " + a.Doctor.User.LastName, pattern)
        || EF.Functions.ILike(
            a.Patient.User.FirstName + " " + a.Patient.User.LastName,
            pattern
        )
        || EF.Functions.ILike(a.VisitReason, pattern)
    );
}
```
Search is implemented server-side using PostgreSQL case-insensitive pattern matching, so the UI can search doctor name, patient name, and visit reason with one field.

From `backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistHandler.cs`:
```csharp
var items = await q.Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(a => new ReceptionistAppointmentDto
    {
        PublicId = a.PublicId,
        Slug = a.Slug,
        VisitReason = a.VisitReason,
        PatientName = a.Patient.User.FirstName + " " + a.Patient.User.LastName,
        DoctorName = a.Doctor.User.FirstName + " " + a.Doctor.User.LastName,
        Status = a.AppointmentStatus.Name,
        Date = a.DoctorSchedule.Date,
        StartTime = a.DoctorSchedule.StartTime,
        EndTime = a.DoctorSchedule.EndTime,
    })
    .ToListAsync(ct);
```
The handler controls pagination and projection into the DTO consumed by frontend components (`AppointmentTable`, calendar panel, CSV export).

From `backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentStatuses/GetAppointmentStatusesEndpoint.cs`:
```csharp
group
    .MapGet(
        $"{ApiEndpoints.Appointments.GetAllStatuses}",
        async (GetAppointmentStatusesHandler handler, CancellationToken ct) =>
        {
            var statuses = await handler.HandleAsync(ct);
            return TypedResults.Ok(statuses);
        }
    )
    .RequireAuthorization();
```
This powers the frontend filter chip options (`useGetAllStatuses`) with authenticated access.

## End-to-End Code Flow
1. Admin/receptionist opens the page component (`AdminAppointmentPage`).
2. Component state determines whether calendar polling or list polling is active.
3. `useAdminAppointments` executes generated hooks for appointments and statuses.
4. Generated hooks call `/api/v1/appointments` and `/api/v1/appointments/statuses`.
5. Backend endpoint binds query params into `GetAllAppointmentsForReceptionistQuery`.
6. Handler applies authorization-approved filtering, searching, sorting, and pagination against EF Core query.
7. Backend returns `PagedResult<ReceptionistAppointmentDto>`.
8. Frontend renders either `AppointmentCalendar` or `AppointmentTable`.
9. If user clicks Export CSV, the export hook fetches all pages, builds escaped CSV rows, and triggers browser download.

## Important Details
- **Polling strategy:** The page polls every 1 second, but only for the currently active view to reduce redundant requests.
- **Filter behavior:** Search/status/today filters are sent as query params, and page resets to 1 whenever criteria change.
- **CSV safety:** Export escapes commas/quotes/newlines and prefixes spreadsheet-formula-like values with `'` to reduce CSV injection risk.
- **Authorization:** Appointment list endpoint explicitly requires `AuthConstants.AdminOrReceptionistPolicy`; statuses endpoint requires authenticated user.
- **Date handling:** Frontend sends `YYYY-MM-DD` strings; backend query uses `DateOnly?` and converts to NodaTime `LocalDate` for filtering.

## Beginner Programmer Notes
- **Custom hook (`useAdminAppointments`)**: Think of it as a "data adapter" that hides API details and returns ready-to-render arrays and flags.
- **Generated API hooks (Orval)**: These are typed wrappers around HTTP requests. You call a function/hook instead of manually writing `fetch`.
- **DTO (Data Transfer Object)**: `ReceptionistAppointmentDto` is the data shape sent from backend to frontend; UI components should rely on this contract.
- **Handler pattern (backend)**: Endpoint handles HTTP concerns; handler contains business/query logic; this keeps code easier to test and maintain.
