# Admin Doctors Page (`AdminDoctorsPage.tsx`) — Technical Explanation

## Short Version
`AdminDoctorsPage` is the admin UI for viewing and managing doctor records. It fetches paginated doctor data from `/api/v1/doctors`, supports debounced text search, filter-by-department/specialization, CSV export, pagination, and launches dialog/form components for view/edit/delete/schedule/add actions. Department chips are loaded from the admin departments endpoint (`/api/v1/admins/departments`), while specialization options are derived from a second doctor query. On the backend, `GetAllDoctorsEndpoint` and `GetAllDoctorsHandler` apply authorization, filtering, paging, and DTO mapping before returning a paged result.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminDoctorsPage.tsx` | Main page component with query calls, filtering state, CSV export logic, pagination, and dialogs. |
| `frontend/src/api/generated/doctors/doctors.ts` | Generated API client/hook definitions for `getAll` and `useGetAll` used by this page. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hook for `useAdminGetAllDepartments` used to populate department filters. |
| `frontend/src/routes/_protected/doctors.tsx` | Route-level admin gate that redirects non-admin users away from the page. |
| `backend/src/TeleHealth.Api/Features/Doctors/GetAllDoctors/GetAllDoctorsEndpoint.cs` | Minimal API route mapping and authorization requirement for doctor list fetch. |
| `backend/src/TeleHealth.Api/Features/Doctors/GetAllDoctors/GetAllDoctorsHandler.cs` | Actual query/filter/pagination/projection logic used by the endpoint. |
| `backend/src/TeleHealth.Api/Features/Doctors/GetAllDoctors/GetAllDoctorsQuery.cs` | Query parameter contract for search, department, specialization, page, and page size. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllDepartments/AdminGetAllDepartmentsEndpoint.cs` | Endpoint mapping + admin authorization for department list used by filter chips. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllDepartments/AdminGetAllDepartmentsHandler.cs` | Department listing logic used to power UI department filter options. |

## Technical Flow
1. User opens `/doctors` route.
2. `beforeLoad` in the route file checks auth store role; non-admin users are redirected to `/dashboard`.
3. `AdminDoctorsPage` mounts and starts three reads:
   - Main paged doctors list (`useGetAll`) with current page/search/filter values.
   - Secondary doctor directory fetch (`useGetAll({ Page: 1, PageSize: 50 })`) used to build specialization options.
   - Departments fetch (`useAdminGetAllDepartments`) used to build department options.
4. Typing in search updates `searchInput`; a `useEffect` debounce waits 400ms then copies into `search` (the real query parameter) and resets page to 1.
5. Filter button opens popover; choosing department/specialization updates local state and resets page.
6. UI conditionally shows loading/error/empty/card grid states.
7. Each doctor card exposes callbacks that set selected doctor state and open the corresponding dialog/form component.
8. Export CSV fetches every page sequentially via raw `getAll(...)`, builds escaped CSV rows, and triggers a browser download.
9. Pagination controls calculate visible page buttons and let user move forward/back or jump pages.

## Frontend Code
From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
const { data, isLoading, isError } = useGetAll(
  {
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
    Department: departmentFilter || undefined,
    Specialization: specializationFilter || undefined,
  },
  {
    query: {
      refetchInterval: DOCTORS_REFETCH_INTERVAL_MS,
    },
  },
);
```

This is the core read query. It ties UI state to backend query params and auto-refetches every second so the directory stays fresh.

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);
  return () => clearTimeout(timer);
}, [searchInput]);
```

This is a debounce pattern: it prevents sending a new request on every keystroke and only applies search after typing pauses.

```tsx
const csv = buildDoctorsCsv(exportedDoctors);
const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
const url = URL.createObjectURL(blob);
...
link.download = `doctors-${today}.csv`;
```

CSV export uses UTF-8 BOM (`\uFEFF`) for Excel-friendly encoding and generates a dated filename.

From `frontend/src/api/generated/doctors/doctors.ts`:

```ts
export const getGetAllUrl = (params?: GetAllParams,) => {
  ...
  return stringifiedParams.length > 0 ? `/api/v1/doctors?${stringifiedParams}` : `/api/v1/doctors`
}
```

This generated client turns TanStack query params into the concrete backend URL.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
return stringifiedParams.length > 0
  ? `/api/v1/admins/departments?${stringifiedParams}`
  : `/api/v1/admins/departments`
```

This generated client builds the department listing endpoint URL used by filter options.

From `frontend/src/routes/_protected/doctors.tsx`:

```tsx
if (role !== "admin") {
  throw redirect({ to: "/dashboard" });
}
```

This is a frontend route guard, preventing non-admin navigation to this page.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Doctors/GetAllDoctors/GetAllDoctorsEndpoint.cs`:

```csharp
.MapGet(
    $"{ApiEndpoints.Doctors.GetAll}",
    async Task<Ok<PagedResult<DoctorListDto>>> (
        [AsParameters] GetAllDoctorsQuery query,
        GetAllDoctorsHandler handler,
        CancellationToken ct
    ) =>
    {
        var doctors = await handler.HandleAsync(query, ct);
        return TypedResults.Ok(doctors);
    }
)
.RequireAuthorization(AuthConstants.AnyRole)
```

The endpoint receives query-string parameters, forwards them to the handler, and requires authenticated users (any role policy).

From `backend/src/TeleHealth.Api/Features/Doctors/GetAllDoctors/GetAllDoctorsHandler.cs`:

```csharp
if (!string.IsNullOrWhiteSpace(query.Search))
{
    var pattern = $"%{query.Search}%";
    doctorsQuery = doctorsQuery.Where(d =>
        EF.Functions.ILike(d.User.FirstName + " " + d.User.LastName, pattern)
        || EF.Functions.ILike(d.User.Email, pattern)
        || EF.Functions.ILike(d.User.Username, pattern)
        || EF.Functions.ILike(d.Specialization, pattern)
        || EF.Functions.ILike(d.Department.Name, pattern)
        || EF.Functions.ILike(d.LicenseNumber, pattern)
    );
}
```

This implements case-insensitive partial search across multiple doctor fields.

```csharp
var doctors = await doctorsQuery
    .OrderBy(d => d.User.LastName)
    .ThenBy(d => d.User.FirstName)
    .Skip((page - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync(ct);
```

This is server-side pagination and stable alphabetical ordering.

```csharp
return new PagedResult<DoctorListDto>(items, totalCount, page, pageSize);
```

The UI receives both current page items and pagination metadata (`totalCount`, `totalPages` via PagedResult).

From `backend/src/TeleHealth.Api/Features/Admins/GetAllDepartments/AdminGetAllDepartmentsEndpoint.cs`:

```csharp
.RequireAuthorization(AuthConstants.AdminPolicy)
```

Department lookup is stricter: only admin policy can access it.

## End-to-End Code Flow
1. Admin navigates to `/doctors`.
2. Route guard confirms role is admin.
3. Page runs `useGetAll` and `useAdminGetAllDepartments` generated hooks.
4. Generated hooks call `/api/v1/doctors` and `/api/v1/admins/departments` through `ofetchMutator`.
5. Backend endpoints map query params to `GetAllDoctorsQuery` and `AdminGetAllDepartmentsQuery`.
6. Handlers execute filtered/paginated EF Core queries.
7. Backend returns paged DTO results.
8. Frontend renders cards, filter chips, counts, and pagination.
9. User action on a card opens corresponding dialog/form component.
10. CSV export loops across all pages and downloads a sanitized CSV file.

## Important Details
- CSV safety: values starting with `=`, `+`, `-`, or `@` are prefixed with `'` to reduce spreadsheet formula injection risk.
- Search is debounced (400ms), reducing request spam while typing.
- Main list query refetches every 1000ms to keep data current.
- Specialization filter options are derived from loaded doctor data (`Set` + sort), while department options come from a dedicated admin endpoint.
- Page number is corrected if filters reduce total pages (`if page > totalPages -> setPage(totalPages)`).
- Frontend role check exists, but backend authorization still enforces access control (critical security layer).

## Beginner Programmer Notes
- **Generated hook**: A function Orval created from OpenAPI, like `useGetAll`, so you avoid hand-writing fetch logic.
- **Mutation vs Query**: Queries read data (`useGetAll`), mutations change data (used in child forms/dialogs like add/edit/delete).
- **DTO**: A data-transfer shape (`DoctorListDto`) returned by backend and used by frontend.
- **Handler**: Backend class that contains business/query logic; endpoint just wires HTTP to handler.
- **Debounce**: Delays action until input settles, useful for search UX.
- **Pagination metadata**: lets UI show current page/total pages and avoid loading huge datasets at once.
