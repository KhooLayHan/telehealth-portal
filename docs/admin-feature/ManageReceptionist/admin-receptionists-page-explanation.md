# Admin Receptionists Page (`AdminReceptionistsPage.tsx`) — Technical Explanation

## Short Version
`AdminReceptionistsPage` is the admin UI screen that lists receptionist accounts with pagination, search, gender filtering, CSV export, and dialogs for view/edit/add/deactivate actions. It pulls data using the generated `useAdminGetAllReceptionists` TanStack Query hook, which calls `GET /api/v1/admins/receptionists`. The backend endpoint is protected by `AuthConstants.AdminPolicy` and returns a paged `AdminReceptionistDto` list after optional search and gender filtering.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminReceptionistsPage.tsx` | Main page component requested by you. |
| `frontend/src/routes/_protected/receptionists.tsx` | Route guard that only allows admins to access this page. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API functions/hook used by this page (`useAdminGetAllReceptionists`). |
| `frontend/src/features/admins/manageReceptionists/UseReceptionistsCsvExport.tsx` | CSV export logic triggered by the page's "Export CSV" button. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsEndpoint.cs` | Backend route mapping and auth requirement. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsQuery.cs` | Query parameter contract used by endpoint binding. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsHandler.cs` | Backend filtering, sorting, paging, and DB query logic. |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminReceptionistDto.cs` | Response DTO shape sent back to frontend. |

## Technical Flow
1. The user navigates to `/_protected/receptionists`.
2. The route `beforeLoad` checks the current auth store role and redirects non-admin users to `/dashboard`.
3. `AdminReceptionistsPage` keeps local UI state for current page, search text, debounced search term, selected gender filter, and dialog open/selected-record states.
4. A 400ms debounce updates the actual search query (`search`) from `searchInput`, then resets to page 1.
5. The page builds `AdminGetAllReceptionistsParams` and calls `useAdminGetAllReceptionists(params, { query: { refetchInterval: 1000 } })`.
6. The generated hook issues `GET /api/v1/admins/receptionists?...` and returns a union response type; the page accepts data only when `status === 200`.
7. Backend endpoint maps the request to `AdminGetAllReceptionistsQuery`, enforces `AdminPolicy`, and calls the handler.
8. The handler applies receptionist-role filtering, optional text search (`ILike` on full name/email/username), optional gender filter (`M/F/O/N`), sorting, and pagination.
9. Backend returns `PagedResult<AdminReceptionistDto>`, and the page renders table rows and pagination controls.
10. Toolbar buttons open filter popover, trigger CSV export, and launch dialogs for add/edit/view/deactivate.

## Frontend Code
From `frontend/src/routes/_protected/receptionists.tsx`:

```tsx
beforeLoad: () => {
  const user = useAuthStore.getState().user;
  const role = user?.role?.toLowerCase();

  if (role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
},
component: AdminReceptionistsPage,
```

This protects the route at the frontend level so only admins can enter the page component.

From `frontend/src/features/admins/AdminReceptionistsPage.tsx`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);
  return () => clearTimeout(timer);
}, [searchInput]);
```

This is a debounce pattern: the API search term updates 400ms after typing stops, reducing frequent requests.

```tsx
const receptionistListParams: AdminGetAllReceptionistsParams = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};

const { data, isLoading, isError } = useAdminGetAllReceptionists(receptionistListParams, {
  query: { refetchInterval: RECEPTIONISTS_REFETCH_INTERVAL_MS },
});

const result = data?.status === 200 ? data.data : null;
```

This builds request params and runs the generated query hook. The code safely narrows to success payload only when HTTP status is 200.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminGetAllReceptionistsUrl = (params?: AdminGetAllReceptionistsParams,) => {
  // ...build query string...
  return stringifiedParams.length > 0
    ? `/api/v1/admins/receptionists?${stringifiedParams}`
    : `/api/v1/admins/receptionists`
}

export const adminGetAllReceptionists = async (params?: AdminGetAllReceptionistsParams, options?: RequestInit)
  : Promise<adminGetAllReceptionistsResponse> => {
  return ofetchMutator<adminGetAllReceptionistsResponse>(getAdminGetAllReceptionistsUrl(params), {
    ...options,
    method: 'GET'
  });
}
```

This generated client code proves the exact backend URL and HTTP method used by the page.

From `frontend/src/features/admins/manageReceptionists/UseReceptionistsCsvExport.tsx`:

```tsx
while (hasNextPage) {
  const response = await adminGetAllReceptionists({
    ...params,
    Page: page,
    PageSize: RECEPTIONISTS_EXPORT_PAGE_SIZE,
  });

  if (response.status !== 200) {
    toast.error("Failed to export receptionists.");
    return;
  }

  receptionists.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```

CSV export reuses the same API endpoint and keeps requesting pages until all receptionist records are collected.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsEndpoint.cs`:

```csharp
group
    .MapGet(ApiEndpoints.Admins.GetAllReceptionists,
        async Task<Ok<PagedResult<AdminReceptionistDto>>> (
            [AsParameters] AdminGetAllReceptionistsQuery query,
            AdminGetAllReceptionistsHandler handler,
            CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(query, ct);
            return TypedResults.Ok(result);
        })
    .RequireAuthorization(AuthConstants.AdminPolicy);
```

This is the endpoint entry point. Query string parameters are bound to `AdminGetAllReceptionistsQuery`, then handled by `AdminGetAllReceptionistsHandler`, with admin-only authorization.

From `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsQuery.cs`:

```csharp
public sealed record AdminGetAllReceptionistsQuery(
    string? Search,
    string? Gender,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
```

This defines supported query params and defaults.

From `backend/src/TeleHealth.Api/Features/Admins/GetAllReceptionists/AdminGetAllReceptionistsHandler.cs`:

```csharp
var q = db.Users.AsNoTracking().Where(u => u.Roles.Any(r => r.Slug == ReceptionistSlug));

if (!string.IsNullOrWhiteSpace(query.Search))
{
    var pattern = $"%{query.Search}%";
    q = q.Where(u =>
        EF.Functions.ILike(u.FirstName + " " + u.LastName, pattern)
        || EF.Functions.ILike(u.Email, pattern)
        || EF.Functions.ILike(u.Username, pattern)
    );
}

var genderFilter = query.Gender?.Trim().ToUpperInvariant();
if (genderFilter is "M" or "F" or "O" or "N")
{
    q = q.Where(u => u.Gender == genderFilter[0]);
}
```

This is the main filtering logic: role filter first, then optional search and gender filters.

```csharp
var items = await q.Skip((page - 1) * pageSize)
    .Take(pageSize)
    .Select(u => new AdminReceptionistDto
    {
        PublicId = u.PublicId,
        FirstName = u.FirstName,
        LastName = u.LastName,
        Username = u.Username,
        Email = u.Email,
        // ...
    })
    .ToListAsync(ct);

return new PagedResult<AdminReceptionistDto>(items, totalCount, page, pageSize);
```

This maps database users into DTOs and returns paged metadata (`totalCount`, page info, hasNextPage, etc.) used by the table UI.

## End-to-End Code Flow
1. **Action starts**: Admin opens the receptionist directory route.
2. **Route protection**: `beforeLoad` allows only users with role `admin`.
3. **Page state setup**: React state tracks search/filter/page/dialogs.
4. **Debounced search**: typing updates `searchInput`, then `search` after 400ms.
5. **API request**: generated hook sends `GET /api/v1/admins/receptionists` with `Page`, `PageSize`, optional `Search`, optional `Gender`.
6. **Backend auth**: endpoint enforces `AuthConstants.AdminPolicy`.
7. **Backend query**: handler filters by receptionist role, applies optional search/gender/sort, paginates, maps DTOs.
8. **Response**: returns `PagedResult<AdminReceptionistDto>`.
9. **UI update**: table renders rows + pagination; loading and error states are shown when needed.
10. **Optional side actions**: export loops through all pages for CSV; dialog actions open feature-specific forms/dialogs.

## Important Details
- **Double access control**: frontend route guard + backend policy check. Backend policy is the real security boundary.
- **Polling behavior**: list refreshes every 1 second (`refetchInterval: 1000`), so UI stays near real-time.
- **Debounce + paging UX**: new search resets to page 1 to avoid empty pages from stale page numbers.
- **Strict gender filter contract**: backend only applies gender filtering for `M/F/O/N`; other values are ignored.
- **Soft delete awareness**: the handler comment notes `HasQueryFilter` on `User`, so deleted users are excluded automatically.

## Beginner Programmer Notes
- **Generated hook** (`useAdminGetAllReceptionists`): code generated from OpenAPI so frontend and backend contracts stay aligned.
- **TanStack Query**: manages request lifecycle (`isLoading`, `isError`, cached data, refetching).
- **DTO (Data Transfer Object)**: `AdminReceptionistDto` is the response shape sent to UI; it avoids returning full entity internals.
- **[AsParameters] binding**: Minimal API feature that binds query-string values directly into a typed record.
- **`AsNoTracking()`**: EF Core read optimization when no entity updates are needed.
