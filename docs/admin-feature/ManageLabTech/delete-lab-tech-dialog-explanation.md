# DeleteLabTechDialog.tsx Technical Explanation

## Short Version
`DeleteLabTechDialog` is the admin confirmation modal used to deactivate a lab technician account from the frontend lab-tech management page. It receives the selected technician, calls a generated TanStack Query mutation hook (`useAdminDeactivateLabTech`), then refreshes the lab-tech list query (`getAdminGetAllLabTechsQueryKey`) so the removed account disappears from the table. The mutation sends a `PATCH` request to `/api/v1/admins/lab-techs/{id}/deactivate`, where the backend endpoint requires admin authorization and the handler performs a soft delete by setting `DeletedAt` instead of hard deleting the user.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx` | Main dialog component, mutation trigger, success/error UI behavior |
| `frontend/src/features/admins/manageLabTech/LabTechTable.tsx` | Shows where the delete action is initiated from row action buttons |
| `frontend/src/api/generated/admins/admins.ts` | Generated API URL, PATCH mutation function, and query key invalidation target |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Source of backend route constant for lab-tech deactivation |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteLabTech/AdminDeleteLabTechEndpoint.cs` | Minimal API route mapping + auth requirement |
| `backend/src/TeleHealth.Api/Features/Admins/DeleteLabTech/AdminDeleteLabTechHandler.cs` | Business logic: find lab-tech user and soft-delete via `DeletedAt` |
| `frontend/src/api/model/AdminLabTechDto.ts` | DTO shape proving `publicId` used by frontend for deactivation request |

## Technical Flow
1. Admin clicks the trash icon in the lab-tech table actions.
2. Parent state opens `DeleteLabTechDialog` with a selected `AdminLabTechDto`.
3. Clicking **Remove** calls `mutate({ id: labTech.publicId.toString() })` from `useAdminDeactivateLabTech`.
4. Generated client sends `PATCH /api/v1/admins/lab-techs/{id}/deactivate`.
5. Backend endpoint validates authorization with `AuthConstants.AdminPolicy`.
6. Handler queries `Users` with role slug `lab-tech`, throws `UserNotFoundException` when no matching user is found, otherwise sets `DeletedAt = current instant` and saves.
7. Frontend `onSuccess` shows a success toast, invalidates the lab-tech list query cache key, and closes dialog.
8. If request fails, frontend catches `ApiError` and shows a backend-provided ProblemDetails title when available.

## Frontend Code
From `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx`:

```tsx
const { mutate, isPending } = useAdminDeactivateLabTech({
  mutation: {
    onSuccess: () => {
      toast.success("Lab technician removed successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to remove lab technician");
        return;
      }
      toast.error("Failed to remove lab technician");
    },
  },
});
```

This is the mutation lifecycle. A **mutation** means a write operation (create/update/delete/deactivate). On success, it refreshes cached list data and closes the modal. On failure, it displays a friendly error toast.

From `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx`:

```tsx
onClick={() => {
  if (labTech.publicId) {
    mutate({ id: labTech.publicId.toString() });
  }
}}
```

The dialog never sends internal DB IDs. It sends the public GUID (`publicId`), matching project external ID strategy.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminDeactivateLabTechUrl = (id: string) => {
  return `/api/v1/admins/lab-techs/${id}/deactivate`
}

export const adminDeactivateLabTech = async (id: string, options?: RequestInit) => {
  return ofetchMutator(getAdminDeactivateLabTechUrl(id), {
    ...options,
    method: 'PATCH'
  });
}
```

This generated code (from OpenAPI/Orval) is the exact HTTP call wrapper the dialog uses indirectly via `useAdminDeactivateLabTech`.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/DeleteLabTech/AdminDeleteLabTechEndpoint.cs`:

```csharp
group
    .MapPatch(
        ApiEndpoints.Admins.DeleteLabTech,
        async Task<NoContent> (Guid id, AdminDeleteLabTechHandler handler, CancellationToken ct) =>
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

This maps the PATCH route, injects handler + cancellation token, and enforces admin-only access.

From `backend/src/TeleHealth.Api/Features/Admins/DeleteLabTech/AdminDeleteLabTechHandler.cs`:

```csharp
var user = await db
    .Users.Include(u => u.Roles)
    .FirstOrDefaultAsync(
        u => u.PublicId == labTechPublicId && u.Roles.Any(r => r.Slug == LabTechSlug),
        ct
    );

if (user is null)
{
    throw new UserNotFoundException(labTechPublicId);
}

user.DeletedAt = SystemClock.Instance.GetCurrentInstant();
await db.SaveChangesAsync(ct);
```

This is a **soft delete**. The account is deactivated by timestamping `DeletedAt` instead of physical deletion.

From `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs`:

```csharp
public const string DeleteLabTech = $"{Base}/lab-techs/{{id:guid}}/deactivate";
```

The route constant keeps endpoint paths centralized and consistent.

## End-to-End Code Flow
1. **User action:** Admin clicks the trash button in `LabTechTable` row actions.
2. **Dialog state:** Parent opens `DeleteLabTechDialog` with selected `labTech` object.
3. **Mutation call:** Dialog invokes `useAdminDeactivateLabTech().mutate({ id })`.
4. **Generated client:** `adminDeactivateLabTech` sends `PATCH` to `/api/v1/admins/lab-techs/{id}/deactivate`.
5. **Endpoint/auth:** `AdminDeleteLabTechEndpoint` receives `Guid id` and enforces `AdminPolicy`.
6. **Handler logic:** `AdminDeleteLabTechHandler` finds lab-tech user by `PublicId` + `lab-tech` role.
7. **Persistence:** Handler sets `DeletedAt` (NodaTime `Instant`) and saves via EF Core.
8. **Frontend refresh:** Success toast, list query invalidation, modal close.
9. **Error path:** Not found/unauthorized/forbidden surfaces as ProblemDetails; frontend shows toast message.

## Important Details
- The dialog returns `null` when no selected `labTech` exists, so it cannot submit invalid requests without context.
- The remove button uses `isPending` to disable duplicate submissions and changes label to `Removing...`.
- Cache invalidation uses `getAdminGetAllLabTechsQueryKey()` so only the relevant list query is refreshed.
- Backend returns `204 No Content` for successful deactivation.
- The handler includes role filtering (`Slug == "lab-tech"`) to avoid deactivating a non-lab-tech user via this route.

## Beginner Programmer Notes
- **Generated hook:** `useAdminDeactivateLabTech` is not handwritten; it is generated by Orval from backend OpenAPI, which keeps frontend/backend contracts in sync.
- **Mutation vs Query:** Query = read data; Mutation = change data. Deactivation is a mutation, so we invalidate related queries afterwards.
- **Soft delete:** Data remains in DB with a deletion timestamp, enabling audit/history and safer recovery patterns.
- **Policy-based auth:** `AuthConstants.AdminPolicy` avoids hardcoded role strings at endpoint call sites and centralizes authorization intent.
