# AdminPatientsPage.tsx Code Flow Explanation

## Short Version
`AdminPatientsPage` is the admin UI screen that lists patients, supports search + gender filter + pagination, and opens dialogs for view/edit/delete/create actions. It fetches patient data through the generated Orval hook `useGetAllPatientsForClinicStaff`, which calls the backend `GET /api/v1/patients/staff` endpoint. The backend endpoint is protected by `AuthConstants.ClinicStaffPolicy`, and the handler applies search, gender filter, paging, sorting, and soft-delete-safe filtering before returning a `PagedResult<ClinicStaffPatientDto>`. CSV export uses a separate client-side loop that fetches all pages and downloads `patients.csv`.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Main page component that wires state, query params, table actions, dialogs, and filter UI. |
| `frontend/src/features/admins/managePatients/PatientTable.tsx` | Displays rows, search input, pagination controls, and row action buttons. |
| `frontend/src/features/admins/managePatients/UsePatientsCsvExport.tsx` | Implements full CSV export behavior and looping fetch. |
| `frontend/src/api/generated/patients/patients.ts` | Generated API client + React Query hook for `/api/v1/patients/staff`. |
| `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffGetAllPatientsEndpoint.cs` | Backend route mapping and authorization requirement. |
| `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffGetAllPatientsQuery.cs` | Request query contract (search/gender/page/pageSize/sort). |
| `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffGetAllPatientsHandler.cs` | Query execution, filters, sort, paging, total count, and DTO mapping. |
| `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffPatientDto.cs` | Response DTO shape returned to frontend. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Confirms endpoint constant `patients/staff`. |

## Technical Flow
1. The page keeps local UI state (`page`, `searchInput`, `search`, `genderFilter`, and dialog selection/open flags).
2. Search typing is debounced by 400 ms in `useEffect`; after the delay, `search` is updated and page resets to 1.
3. The page builds `patientListParams` with `Page`, `PageSize`, optional `Search`, and optional `Gender`.
4. `useGetAllPatientsForClinicStaff(patientListParams, { query: { refetchInterval: 1000 } })` fetches data every second.
5. The table receives normalized data (`items`, `totalCount`, `totalPages`) and callbacks for view/edit/remove.
6. Gender filter buttons toggle M/F/O/N (or clear), then reset to page 1.
7. Dialog components (`AddNewPatientForm`, `EditPatientForm`, `DeletePatientDialog`, `ViewPatientDetailDialog`) open based on selected patient state.
8. CSV export button triggers `usePatientsCsvExport`, which repeatedly calls `getAllPatientsForClinicStaff` page-by-page and downloads a CSV in-browser.

## Frontend Code
From `frontend/src/features/admins/AdminPatientsPage.tsx`:
```tsx
const patientListParams: GetAllPatientsForClinicStaffParams & { Gender?: string } = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};

const { data, isLoading } = useGetAllPatientsForClinicStaff(patientListParams, {
  query: {
    refetchInterval: PATIENTS_REFETCH_INTERVAL_MS,
  },
});
```
This is the key bridge to the API. The query params are shaped to match backend expectations (`Page`, `PageSize`, `Search`, `Gender`), and React Query handles loading/caching/refetching.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);

  return () => clearTimeout(timer);
}, [searchInput]);
```
This debounce avoids sending a request on every keystroke; instead it waits 400ms after typing stops.

From `frontend/src/features/admins/managePatients/UsePatientsCsvExport.tsx`:
```tsx
while (hasNextPage) {
  const response = await getAllPatientsForClinicStaff({
    Page: page,
    PageSize: PATIENTS_EXPORT_PAGE_SIZE,
  });

  if (response.status !== 200) {
    toast.error("Failed to export patients.");
    return;
  }

  patients.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```
Export does not rely on currently displayed page data. It pulls all pages from the backend and then builds a CSV locally.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffGetAllPatientsEndpoint.cs`:
```csharp
group
    .MapGet(
        ApiEndpoints.Patients.GetAllPatientsForClinicStaff,
        async Task<Ok<PagedResult<ClinicStaffPatientDto>>> (
            [AsParameters] ClinicStaffGetAllPatientsQuery query,
            ClinicStaffGetAllPatientsHandler handler,
            CancellationToken ct
        ) =>
        {
            var patients = await handler.HandleAsync(query, ct);
            return TypedResults.Ok(patients);
        }
    )
    .RequireAuthorization(AuthConstants.ClinicStaffPolicy);
```
The endpoint binds URL query parameters into `ClinicStaffGetAllPatientsQuery`, forwards to handler, and enforces clinic-staff authorization.

From `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffGetAllPatientsHandler.cs`:
```csharp
if (!string.IsNullOrWhiteSpace(query.Search))
{
    var pattern = $"%{query.Search}%";
    q = q.Where(p => EF.Functions.ILike(p.User.FirstName + " " + p.User.LastName, pattern));
}

var genderFilter = query.Gender?.Trim().ToUpperInvariant();
if (genderFilter is "M" or "F" or "O" or "N")
{
    q = q.Where(p => p.User.Gender == genderFilter[0]);
}
```
These are the exact filter rules that match the frontend search and gender buttons.

From `backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForClinicStaff/ClinicStaffPatientDto.cs`:
```csharp
public sealed record ClinicStaffPatientDto(
    Guid PatientPublicId,
    string Slug,
    string Username,
    string Email,
    string IcNumber,
    string FirstName,
    string LastName,
    string FullName,
    string? AvatarUrl,
    LocalDate DateOfBirth,
    ...
)
```
This is the response shape consumed by `PatientTable` and dialogs. It includes profile and medical-context fields used in admin operations.

## End-to-End Code Flow
1. Admin opens the “Manage Patients” screen.
2. `AdminPatientsPage` initializes UI state and calls `useGetAllPatientsForClinicStaff`.
3. Generated client builds URL `/api/v1/patients/staff?...` and sends a GET request.
4. Backend endpoint `MapClinicStaffGetAllPatientsEndpoint` receives request and applies `ClinicStaffPolicy` auth.
5. `ClinicStaffGetAllPatientsHandler` applies soft-delete-safe base query, search filter, gender filter, sorting, paging.
6. Handler maps entities to `ClinicStaffPatientDto`, wraps in `PagedResult`, returns 200 OK.
7. Frontend renders rows in `PatientTable`; actions open dialogs; pagination/search/filter update query params and refetch.
8. If CSV export is clicked, frontend fetches all pages sequentially and downloads `patients.csv`.

## Important Details
- Search is client-debounced (400ms), so backend receives fewer query bursts.
- Page resets to 1 whenever search/filter changes.
- Gender filter is strictly validated server-side (`M/F/O/N` only), which protects against malformed query strings.
- Backend explicitly protects against soft-deleted related users in counting logic.
- Endpoint requires `AuthConstants.ClinicStaffPolicy` and returns 401 problem details when unauthorized.
- Polling every 1 second means the table stays fresh but may increase API load.
- CSV escaping includes formula-injection mitigation by prefixing suspicious cells with `'`.

## Beginner Programmer Notes
- **Generated hook**: `useGetAllPatientsForClinicStaff` is auto-generated from OpenAPI, so frontend and backend stay in sync on path/params/types.
- **DTO**: `ClinicStaffPatientDto` is a “data transfer object” (a safe, shaped response model).
- **Handler**: in this codebase, DB reads/writes happen in handlers, not repositories.
- **PagedResult**: backend returns `items` plus paging metadata (`totalCount`, `hasNextPage`, etc.) so the UI can paginate correctly.
