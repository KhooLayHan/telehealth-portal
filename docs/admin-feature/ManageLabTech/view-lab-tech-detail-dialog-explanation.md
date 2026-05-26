# ViewLabTechDetailDialog.tsx Technical Explanation

## Short Version
`ViewLabTechDetailDialog` is the admin modal that displays detailed profile information for one lab technician, including personal info and address. It starts with a lab tech row selected from the admin list page, then optionally refreshes the selected record from the backend using the generated `useAdminGetLabTech` query hook. The data request goes to `GET /api/v1/admins/lab-techs/{id}`, which is protected by the admin authorization policy and served by a backend handler that maps a `User` row into `AdminLabTechDto`.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/ViewLabTechDetailDialog.tsx` | Main dialog component and presentation logic for rendering detailed lab tech info. |
| `frontend/src/features/admins/AdminLabTechsPage.tsx` | Shows where this dialog is mounted and how selected row data is passed into it. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API function + TanStack Query hook (`useAdminGetLabTech`) used by the dialog. |
| `frontend/src/api/model/AdminLabTechDto.ts` | Frontend DTO shape consumed by the dialog. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Defines canonical backend route string for admin lab tech detail endpoint. |
| `backend/src/TeleHealth.Api/Features/Admins/GetLabTech/AdminGetLabTechEndpoint.cs` | Maps HTTP GET endpoint, response types, and admin authorization requirement. |
| `backend/src/TeleHealth.Api/Features/Admins/GetLabTech/AdminGetLabTechHandler.cs` | Executes EF query to fetch a specific lab tech and project it to `AdminLabTechDto`. |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Declares `AdminPolicy` constant used by endpoint authorization. |

## Technical Flow
1. The admin list page (`AdminLabTechsPage`) stores a selected `AdminLabTechDto` and opens `ViewLabTechDetailDialog` when the user clicks View.
2. The dialog receives three props: `labTech` (selected row), `open` (modal state), and `onOpenChange` (close/open callback).
3. Inside the dialog, `labTech.publicId` is used to call the generated query hook `useAdminGetLabTech`.
4. The query is enabled only when the dialog is open and the `publicId` exists (`enabled: open && !!labTechId`).
5. While fetching, the dialog still renders the passed-in row data so the UI is responsive, and then swaps to fresher backend data once the request returns HTTP 200.
6. The backend endpoint requires admin auth (`RequireAuthorization(AuthConstants.AdminPolicy)`), so non-admin users receive 401/403 responses.
7. The handler filters users by matching `PublicId` and role slug `lab-tech`, then projects the database entity to `AdminLabTechDto`; if not found, it throws `UserNotFoundException` (404 path).

## Frontend Code
From `frontend/src/features/admins/manageLabTech/ViewLabTechDetailDialog.tsx`:
```tsx
const labTechId = labTech?.publicId ?? "";
const { data, isError, isFetching } = useAdminGetLabTech(labTechId, {
  query: {
    enabled: open && !!labTechId,
  },
});
const fetchedLabTech = data?.status === 200 ? data.data : null;
const displayedLabTech = fetchedLabTech ?? labTech;
```
This is the core fetch strategy. The dialog starts from selected row data (`labTech`) and upgrades to backend-fresh data (`fetchedLabTech`) when available.

From `frontend/src/features/admins/manageLabTech/ViewLabTechDetailDialog.tsx`:
```tsx
{(isFetching || isError) && (
  <p className="mt-2 text-muted-foreground text-xs" aria-live="polite">
    {isFetching
      ? "Refreshing details..."
      : "Could not refresh details from the backend."}
  </p>
)}
```
This provides explicit refresh/error status text for users without blocking the dialog.

From `frontend/src/features/admins/manageLabTech/ViewLabTechDetailDialog.tsx`:
```tsx
<DetailRow label="Gender" value={genderLabel(displayedLabTech.gender)} />
<DetailRow label="Date of Birth" value={formatDate(displayedLabTech.dateOfBirth)} />
<DetailRow label="Phone" value={displayedLabTech.phoneNumber || "N/A"} />
<DetailRow label="IC Number" value={displayedLabTech.icNumber || "N/A"} />
```
The dialog normalizes null/empty values for readable UI and uses helper functions for safer formatting.

From `frontend/src/api/generated/admins/admins.ts`:
```ts
export const getAdminGetLabTechUrl = (id: string,) => {
  return `/api/v1/admins/lab-techs/${id}`
}

export const adminGetLabTech = async (id: string, options?: RequestInit): Promise<adminGetLabTechResponse> => {
  return ofetchMutator<adminGetLabTechResponse>(getAdminGetLabTechUrl(id), {
    ...options,
    method: 'GET'
  });
}
```
This is the generated API client path used by the query hook. The URL is parameterized with the lab tech GUID.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/GetLabTech/AdminGetLabTechEndpoint.cs`:
```csharp
group
    .MapGet(
        ApiEndpoints.Admins.GetLabTech,
        async Task<Ok<AdminLabTechDto>> (Guid id, AdminGetLabTechHandler handler, CancellationToken ct) =>
        {
            var result = await handler.HandleAsync(id, ct);
            return TypedResults.Ok(result);
        }
    )
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status404NotFound);
```
This maps the HTTP endpoint and enforces admin authorization. It also documents 401/403/404 error responses.

From `backend/src/TeleHealth.Api/Features/Admins/GetLabTech/AdminGetLabTechHandler.cs`:
```csharp
var labTech =
    await db
        .Users.AsNoTracking()
        .Where(u => u.PublicId == labTechPublicId && u.Roles.Any(r => r.Slug == LabTechSlug))
        .Select(u => new AdminLabTechDto
        {
            PublicId = u.PublicId,
            FirstName = u.FirstName,
            LastName = u.LastName,
            Username = u.Username,
            Email = u.Email,
            PhoneNumber = u.Phone,
            Slug = u.Slug,
            IcNumber = u.IcNumber,
            Gender = u.Gender,
            DateOfBirth = u.DateOfBirth,
            AvatarUrl = u.AvatarUrl,
            Address = u.Address,
            CreatedAt = u.CreatedAt,
            DeletedAt = u.DeletedAt,
        })
        .FirstOrDefaultAsync(ct)
    ?? throw new UserNotFoundException(labTechPublicId);
```
This is the database read logic. It confirms the user is a lab tech role and returns a DTO the frontend can render directly.

From `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs`:
```csharp
public const string GetLabTech = $"{Base}/lab-techs/{{id:guid}}";
```
The canonical backend route definition (under admin endpoints) is what OpenAPI uses to generate frontend client code.

## End-to-End Code Flow
1. Admin clicks **View** on a lab technician row in `AdminLabTechsPage`.
2. `selectedLabTech` is passed to `ViewLabTechDetailDialog` with `open=true`.
3. Dialog immediately renders profile basics from the selected row object.
4. Dialog triggers `useAdminGetLabTech(publicId)` if open and ID exists.
5. Generated client sends `GET /api/v1/admins/lab-techs/{id}`.
6. Backend endpoint validates auth with `AdminPolicy` and calls `AdminGetLabTechHandler`.
7. Handler queries `Users` table for matching `PublicId` + `lab-tech` role and projects `AdminLabTechDto`.
8. Backend returns 200 DTO (or 404 if not found).
9. Frontend swaps from fallback row data to fetched DTO and keeps modal fields updated.

## Important Details
- The dialog follows a **stale-while-refresh UX pattern**: it shows existing selected-row data while attempting a backend refresh.
- Query execution is guarded by `enabled: open && !!labTechId`, preventing unnecessary requests when the modal is closed.
- The endpoint is explicitly protected by `AuthConstants.AdminPolicy`; this is a critical security boundary for staff profile access.
- `formatDate` and `genderLabel` helpers avoid raw or invalid values in the UI and provide graceful fallback (`N/A`).
- If the backend refresh fails, users still see already-loaded details and a lightweight warning message.

## Beginner Programmer Notes
- **Generated hook** (`useAdminGetLabTech`): Orval-generated wrapper around a backend endpoint, integrated with TanStack Query caching and request state.
- **DTO (Data Transfer Object)**: `AdminLabTechDto` is the shape sent over HTTP, separate from full database entity internals.
- **Endpoint vs Handler**: Endpoint maps HTTP route + auth; handler does business/data logic.
- **AsNoTracking()**: EF Core read optimization for query-only operations where entities are not being updated.
