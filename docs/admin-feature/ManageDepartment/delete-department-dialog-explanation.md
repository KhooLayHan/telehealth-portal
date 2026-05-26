# DeleteDepartmentDialog.tsx Technical Explanation

## Short Version
`DeleteDepartmentDialog` is a confirmation modal used by admins before removing a department from active use. It calls the generated `useAdminDeleteDepartment` mutation, then refreshes the department list cache with `invalidateQueries` so the UI reflects the removal immediately. On the backend, the delete route is a soft delete endpoint (`PATCH /api/v1/admins/departments/{slug}/deactivate`) protected by admin authorization and blocked if the department still has assigned doctors.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx` | Main component being explained; handles dialog UI, mutation call, and success/error toasts. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Defines `DepartmentTableRow`; shows that `id` used by delete is actually the department `slug`. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hook/mutation and query key used by the dialog (`useAdminDeleteDepartment`, `getAdminGetAllDepartmentsQueryKey`). |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteDepartment/AdminDeleteDepartmentEndpoint.cs` | Maps the protected admin endpoint and response contracts. |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteDepartment/AdminDeleteDepartmentHandler.cs` | Actual deletion logic: find by slug, block if doctors exist, soft-delete via `DeletedAt`. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Defines the route template constant for delete department. |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Defines `AdminPolicy` used by the endpoint authorization. |

## Technical Flow
1. A parent screen opens this dialog by passing three props:
   - `department`: selected row
   - `open`: boolean state
   - `onOpenChange`: callback to open/close the modal
2. If `department` is `null`, the component returns `null` (nothing renders). This prevents accidental API calls without a selected target.
3. When user clicks **Remove**, `handleConfirmDelete` runs and calls:
   - `mutateAsync({ slug: department.id })`
4. In this table model, `department.id` is actually the department slug (mapped in `toDepartmentTableRow`).
5. On success:
   - success toast shown
   - query cache for department listing invalidated via `getAdminGetAllDepartmentsQueryKey()`
   - dialog closes
6. On failure:
   - if error is `ApiError`, show backend `ProblemDetails.title` when available
   - otherwise show generic failure toast
7. Backend endpoint receives slug, enforces admin policy, checks for assigned doctors, and if safe, sets `DeletedAt` (soft delete) and returns `204 No Content`.

## Frontend Code
From `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminDeleteDepartment();

const handleConfirmDelete = async () => {
  try {
    await mutateAsync({ slug: department.id });
    toast.success("Department deleted successfully");
    await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
    onOpenChange(false);
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.data.title ?? "Failed to delete department");
      return;
    }

    toast.error("Failed to delete department");
  }
};
```

This is the core action flow: call delete mutation, refresh list cache, close dialog, and show user feedback.

From `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx`:

```tsx
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "",
    staffMembers: Number(department.staffMembers ?? 0),
    createdAt: department.createdAt,
  };
}
```

This explains why delete uses `department.id` but sends it as `slug`: the row model stores slug inside `id`.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminDeleteDepartmentUrl = (slug: string) => {
  return `/api/v1/admins/departments/${slug}/deactivate`
}

export const adminDeleteDepartment = async (slug: string, options?: RequestInit) => {
  return ofetchMutator(getAdminDeleteDepartmentUrl(slug), {
    ...options,
    method: 'PATCH'
  })
}
```

This generated client function is what `useAdminDeleteDepartment` wraps.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/DeleteDepartment/AdminDeleteDepartmentEndpoint.cs`:

```csharp
group
    .MapPatch(
        ApiEndpoints.Admins.DeleteDepartment,
        async Task<NoContent> (string slug, AdminDeleteDepartmentHandler handler, CancellationToken ct) =>
        {
            await handler.HandleAsync(slug, ct);
            return TypedResults.NoContent();
        }
    )
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status404NotFound)
    .ProducesProblem(StatusCodes.Status409Conflict);
```

This defines the route and security. Only admins can call it.

From `backend/src/TeleHealth.Api/Features/Admins/DeleteDepartment/AdminDeleteDepartmentHandler.cs`:

```csharp
var department =
    await db.Departments.FirstOrDefaultAsync(d => d.Slug == slug, ct)
    ?? throw new DepartmentNotFoundException();

var hasAssignedStaff = await db.Doctors.AnyAsync(d => d.DepartmentId == department.Id, ct);

if (hasAssignedStaff)
{
    throw new DepartmentHasAssignedStaffException();
}

department.DeletedAt = SystemClock.Instance.GetCurrentInstant();

await db.SaveChangesAsync(ct);
```

This is where the business rules live:
- find department by slug
- block delete when doctors still reference it
- soft delete (set `DeletedAt`) instead of hard delete

## End-to-End Code Flow
1. Admin clicks delete action in department management UI.
2. Parent component opens `DeleteDepartmentDialog` with selected row data.
3. Dialog submit calls `useAdminDeleteDepartment().mutateAsync({ slug })`.
4. Generated API client sends `PATCH /api/v1/admins/departments/{slug}/deactivate`.
5. Backend endpoint validates auth with `AuthConstants.AdminPolicy`.
6. Handler checks department existence and assigned-doctor conflict.
7. Handler sets `DeletedAt`, saves, and returns `204`.
8. Frontend invalidates departments query key and table refetches without removed department.

## Important Details
- **Soft delete behavior**: This action does not physically remove the row; it marks `DeletedAt` and relies on backend query filters to hide deleted records from active lists.
- **Conflict path**: If doctors are still assigned, backend throws `DepartmentHasAssignedStaffException`, which surfaces to frontend as an `ApiError` and is shown via toast.
- **Query refresh**: Using `invalidateQueries` keeps the UI consistent after mutation.
- **User-facing wording vs implementation**: Dialog text says “remove/deactivate,” which matches backend soft-delete semantics.

## Beginner Programmer Notes
- A **mutation** in TanStack Query is an operation that changes server data (create/update/delete).
- A **query key** is how TanStack Query identifies cached data; invalidating it triggers fresh data fetch.
- **Generated hooks** (`useAdminDeleteDepartment`) come from OpenAPI and reduce manual HTTP code.
- **Soft delete** means “mark as deleted” rather than physically deleting database rows.
