# AdminLabTechsPage.tsx Technical Explanation

## Short Version
`AdminLabTechsPage` is the admin UI for browsing and managing lab technician accounts. It keeps page/search/filter state in React, calls the generated `useAdminGetAllLabTechs` TanStack Query hook, and renders a table with actions to view, edit, delete (deactivate), and create lab tech records. The hook ultimately sends a `GET /api/v1/admins/lab-techs` request, which the backend route maps to `AdminGetAllLabTechsHandler` with admin-only authorization.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminLabTechsPage.tsx` | Main page component that owns UI state, list query params, dialogs, and table actions. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API client + TanStack Query hook used by the page (`useAdminGetAllLabTechs`). |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsEndpoint.cs` | Backend endpoint mapping for `GET /admins/lab-techs` and authorization policy. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsQuery.cs` | Query parameter contract used by endpoint binding. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsHandler.cs` | Query logic: role filter, search, gender filter, sort, pagination, and DTO projection. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Central route constant for admin lab tech listing endpoint. |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Source of `AuthConstants.AdminPolicy` used to protect the endpoint. |

## Technical Flow
1. The page starts with local React state for:
   - pagination (`page`),
   - search text (`searchInput` with debounced `search`),
   - gender filter (`genderFilter`),
   - dialog state for add/view/edit/delete.
2. A `useEffect` waits 400ms after typing in search before applying it and resetting pagination to page 1.
3. The page builds request parameters (`Page`, `PageSize`, optional `Search`, optional `Gender`) and passes them into the generated hook `useAdminGetAllLabTechs`.
4. The generated hook calls `GET /api/v1/admins/lab-techs` with query string params and uses TanStack Query for loading/error/data state.
5. On the backend, `AdminGetAllLabTechsEndpoint` binds query params into `AdminGetAllLabTechsQuery`, enforces `AuthConstants.AdminPolicy`, and calls the handler.
6. The handler filters to users with role slug `lab-tech`, applies optional text and gender filtering, applies sort order, paginates, and returns `PagedResult<AdminLabTechDto>`.
7. The page renders loading/error/table UI and opens the related dialog components when row actions are triggered.

## Frontend Code
From `frontend/src/features/admins/AdminLabTechsPage.tsx`:
```tsx
const [searchInput, setSearchInput] = useState("");
const [search, setSearch] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);

  return () => clearTimeout(timer);
}, [searchInput]);
```
This is a **debounced search** pattern: the API call is delayed until the user pauses typing, which reduces request spam.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:
```tsx
const labTechListParams: AdminGetAllLabTechsParams & { Gender?: string } = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};

const { data, isLoading, isError } = useAdminGetAllLabTechs(labTechListParams, {
  query: {
    refetchInterval: LAB_TECHS_REFETCH_INTERVAL_MS,
  },
});
```
This builds the request payload and runs the generated query hook. The `refetchInterval` (1000 ms) means the list is polled every second.

From `frontend/src/api/generated/admins/admins.ts`:
```ts
return stringifiedParams.length > 0 ? `/api/v1/admins/lab-techs?${stringifiedParams}` : `/api/v1/admins/lab-techs`
...
const queryFn = ({ signal }) => adminGetAllLabTechs(params, { signal, ...requestOptions });
...
const query = useQuery(queryOptions, queryClient)
```
This is the generated client wiring: build URL, execute fetch, and store state in TanStack Query cache.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsEndpoint.cs`:
```csharp
group
    .MapGet(ApiEndpoints.Admins.GetAllLabTechs, async ...)
    .RequireAuthorization(AuthConstants.AdminPolicy);
```
This maps the request route and protects it so only authorized admin users can access it.

From `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsHandler.cs`:
```csharp
var q = db.Users.AsNoTracking().Where(u => u.Roles.Any(r => r.Slug == LabTechSlug));

if (!string.IsNullOrWhiteSpace(query.Search))
{
    var pattern = $"%{query.Search}%";
    q = q.Where(u =>
        EF.Functions.ILike(u.FirstName + " " + u.LastName, pattern)
        || EF.Functions.ILike(u.Email, pattern)
        || EF.Functions.ILike(u.Username, pattern)
        || (u.Phone != null && EF.Functions.ILike(u.Phone, pattern))
    );
}
```
This is the data filter pipeline:
- start with users who have `lab-tech` role,
- optionally apply case-insensitive partial search over name/email/username/phone.

From `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsHandler.cs`:
```csharp
var genderFilter = query.Gender?.Trim().ToUpperInvariant();
if (genderFilter is "M" or "F" or "O" or "N")
{
    q = q.Where(u => u.Gender == genderFilter[0]);
}

q = query.SortOrder?.ToLowerInvariant() == "desc"
    ? q.OrderByDescending(u => u.LastName).ThenByDescending(u => u.FirstName)
    : q.OrderBy(u => u.LastName).ThenBy(u => u.FirstName);
```
This applies safe gender filtering and deterministic sorting.

From `backend/src/TeleHealth.Api/Features/Admins/GetAllLabTechs/AdminGetAllLabTechsHandler.cs`:
```csharp
var totalCount = await q.CountAsync(ct);

var items = await q.Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(u => new AdminLabTechDto { ... })
    .ToListAsync(ct);

return new PagedResult<AdminLabTechDto>(items, totalCount, page, pageSize);
```
This is standard pagination: count all matching rows, fetch just one page, map to DTOs, return metadata + items.

## End-to-End Code Flow
1. Admin opens the Lab Technician Directory page.
2. `AdminLabTechsPage` initializes state and renders toolbar/table.
3. Query params are assembled from state and passed to `useAdminGetAllLabTechs`.
4. Generated API client sends `GET /api/v1/admins/lab-techs` with query string (`Page`, `PageSize`, optional `Search`, optional `Gender`).
5. Backend endpoint binds params into `AdminGetAllLabTechsQuery`, checks `AdminPolicy`, and calls handler.
6. Handler runs filtered/sorted/paginated EF query and returns `PagedResult<AdminLabTechDto>`.
7. Frontend reads `data.data` when `status === 200`, renders rows in `LabTechTable`, and wires row actions to open view/edit/delete dialogs.

## Important Details
- Search is debounced to 400ms, but polling is every 1000ms, so results keep refreshing even without user input.
- `PageSize` on frontend is fixed to `5`, while backend clamps any incoming size to a max of `50` for safety.
- Gender filtering is shared conceptually across frontend and backend (`M/F/O/N`), with backend validating accepted values before applying the filter.
- The endpoint uses centralized route and policy constants, which keeps routing/security consistent across the API.

## Beginner Programmer Notes
- **Generated hook**: code created from OpenAPI (Orval) so frontend and backend stay in sync.
- **TanStack Query**: manages API state (`isLoading`, `isError`, cached data) and refetch behavior.
- **DTO** (`AdminLabTechDto`): a data shape returned to the frontend; it avoids exposing internal DB entities directly.
- **Endpoint + Handler split**: endpoint handles HTTP plumbing/security, handler handles business/data logic.
