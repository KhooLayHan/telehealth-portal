# DeleteReceptionistDialog.tsx Code Flow Explanation

## Short Version
`DeleteReceptionistDialog` is the confirmation modal used by admins to deactivate a receptionist account from the receptionist directory page. It receives the selected receptionist from `AdminReceptionistsPage`, calls the generated `useAdminDeactivateReceptionist` mutation, and closes itself after success. The data refresh happens by invalidating the receptionist list query key so TanStack Query refetches active receptionists. On the backend, the request maps to an admin-only PATCH endpoint that soft-deletes the receptionist by setting `DeletedAt` instead of removing the user row.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/DeleteReceptionistDialog.tsx` | Main dialog component being explained. |
| `frontend/src/features/admins/AdminReceptionistsPage.tsx` | Parent page that chooses which receptionist to deactivate and opens this dialog. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API client/hook used by this dialog (`useAdminDeactivateReceptionist`). |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Source of backend route constant for receptionist deactivation. |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteReceptionist/AdminDeleteReceptionistEndpoint.cs` | Backend route mapping, auth requirement, and response codes. |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteReceptionist/AdminDeleteReceptionistHandler.cs` | Backend business logic that performs soft delete (`DeletedAt`). |

## Technical Flow
1. In `AdminReceptionistsPage`, when the user clicks deactivate for a row, `handleDeactivate` stores that `AdminReceptionistDto` in local state and opens the dialog.
2. `DeleteReceptionistDialog` receives `receptionist`, `open`, and `onOpenChange` props from the page.
3. The dialog configures `useAdminDeactivateReceptionist` (a generated TanStack Query mutation hook).
4. Clicking **Remove** calls `mutate({ id: receptionist.publicId.toString() })`.
5. The generated client sends `PATCH /api/v1/admins/receptionists/{id}/deactivate`.
6. Backend endpoint requires `AuthConstants.AdminPolicy`, then calls `AdminDeleteReceptionistHandler.HandleAsync(id, ct)`.
7. Handler finds a user with matching `PublicId` and `receptionist` role slug, sets `DeletedAt = current instant`, and saves.
8. Frontend `onSuccess` shows a toast, invalidates receptionist list cache (`getAdminGetAllReceptionistsQueryKey()`), and closes the dialog.
9. If mutation fails and the error is `ApiError`, the dialog shows `error.data.title` or fallback text.

## Frontend Code
From `frontend/src/features/admins/manageReceptionists/DeleteReceptionistDialog.tsx`:

```tsx
const { mutate, isPending } = useAdminDeactivateReceptionist({
  mutation: {
    onSuccess: () => {
      toast.success("Receptionist removed successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to remove receptionist");
      }
    },
  },
});
```

This mutation setup defines the behavior after a network response:
- **Success**: show confirmation toast, refresh receptionist list data, close modal.
- **Error**: parse structured API problem response and show a user-friendly toast.

From `frontend/src/features/admins/manageReceptionists/DeleteReceptionistDialog.tsx`:

```tsx
<Button
  type="button"
  variant="destructive"
  disabled={isPending}
  onClick={() => {
    if (receptionist.publicId) {
      mutate({ id: receptionist.publicId.toString() });
    }
  }}
>
  {isPending ? "Removing..." : "Remove"}
</Button>
```

This button is the trigger for deactivation. `isPending` prevents duplicate clicks while request is in progress.

From `frontend/src/features/admins/AdminReceptionistsPage.tsx`:

```tsx
const handleDeactivate = (receptionist: AdminReceptionistDto) => {
  setDeactivateReceptionist(receptionist);
  setDeactivateDialogOpen(true);
};
```

This is how the page passes the selected receptionist into the dialog flow.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/DeleteReceptionist/AdminDeleteReceptionistEndpoint.cs`:

```csharp
group
    .MapPatch(
        ApiEndpoints.Admins.DeleteReceptionist,
        async Task<NoContent> (Guid id, AdminDeleteReceptionistHandler handler, CancellationToken ct) =>
        {
            await handler.HandleAsync(id, ct);
            return TypedResults.NoContent();
        }
    )
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .ProducesProblem(StatusCodes.Status401Unauthorized)
    .ProducesProblem(StatusCodes.Status403Forbidden)
    .ProducesProblem(StatusCodes.Status404NotFound);
```

This endpoint maps the PATCH route and enforces admin authorization. It returns HTTP 204 on success.

From `backend/src/TeleHealth.Api/Features/Admins/DeleteReceptionist/AdminDeleteReceptionistHandler.cs`:

```csharp
var user = await db
    .Users.Include(u => u.Roles)
    .FirstOrDefaultAsync(
        u =>
            u.PublicId == receptionistPublicId
            && u.Roles.Any(r => r.Slug == ReceptionistSlug),
        ct
    );

if (user is null)
{
    throw new UserNotFoundException(receptionistPublicId);
}

user.DeletedAt = SystemClock.Instance.GetCurrentInstant();
await db.SaveChangesAsync(ct);
```

This is the soft-delete logic:
- It only deactivates users that actually have the `receptionist` role.
- Missing user produces a 404-style error path.
- `DeletedAt` timestamp marks the record as inactive (not hard deleted).

## End-to-End Code Flow
1. Admin clicks deactivate action for a receptionist row in the receptionist table.
2. `AdminReceptionistsPage` stores selected receptionist and opens `DeleteReceptionistDialog`.
3. Dialog renders receptionist name in confirmation text so admin verifies the target.
4. Admin confirms by clicking **Remove**.
5. `useAdminDeactivateReceptionist` mutation calls generated client function.
6. Client sends PATCH request to `/api/v1/admins/receptionists/{id}/deactivate`.
7. Backend endpoint authorizes admin and delegates to handler.
8. Handler finds receptionist user, sets `DeletedAt`, saves changes, returns 204.
9. Frontend success callback invalidates receptionist list query key.
10. TanStack Query refetches receptionist list, and deactivated user disappears from active list results.

## Important Details
- **Soft delete, not hard delete**: backend sets `DeletedAt` instead of deleting row.
- **Role safety**: handler checks that the targeted user has the `receptionist` role slug.
- **Authorization**: endpoint requires `AuthConstants.AdminPolicy`.
- **Cache refresh strategy**: uses `invalidateQueries` with `getAdminGetAllReceptionistsQueryKey()`.
- **Error UX**: only `ApiError` is shown; message comes from ProblemDetails `title` when available.

## Beginner Programmer Notes
- A **mutation hook** in TanStack Query is the tool for write operations (create/update/delete-like actions).
- The generated hook (`useAdminDeactivateReceptionist`) comes from OpenAPI/Orval codegen, so frontend code does not handwrite fetch details.
- **Query invalidation** means "mark cached data stale and refetch" so UI reflects backend state changes.
- A **soft delete** keeps history/auditability by timestamping inactive records instead of removing them permanently.
