# DeleteDoctorDialog.tsx Explanation

## Short Version
`DeleteDoctorDialog` is a confirmation modal in the admin doctors UI that triggers a soft-delete API call when the admin confirms removal. It uses a generated TanStack Query mutation hook (`useDeleteDoctorById`) to call `PATCH /api/v1/doctors/{id}/deactivate`, then refreshes the doctor list cache with `invalidateQueries`. On success it closes the modal and shows a toast; on failure it shows an error toast using standardized `ApiError` handling.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx` | Main component the user asked about; contains dialog UI, mutation call, and toast/cache behavior. |
| `frontend/src/features/admins/AdminDoctorsPage.tsx` | Parent page that passes selected doctor + open state into `DeleteDoctorDialog`. |
| `frontend/src/api/generated/doctors/doctors.ts` | Generated client that defines `useDeleteDoctorById`, endpoint URL, and HTTP method. |
| `backend/src/TeleHealth.Api/Features/Doctors/DeleteDoctor/DeleteDoctorEndpoint.cs` | Backend endpoint mapping for the route used by the dialog. |
| `backend/src/TeleHealth.Api/Features/Doctors/DeleteDoctor/DeleteDoctorHandler.cs` | Business logic that performs soft delete in database. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Canonical route constants showing doctor deactivate path. |
| `backend/src/TeleHealth.Api/Common/Extensions/EndpointMappingExtensions.cs` | Shows this endpoint is registered in app startup mapping pipeline. |

## Technical Flow
1. Admin opens the Doctors page and picks “remove” for a selected doctor (in `AdminDoctorsPage`).
2. `AdminDoctorsPage` renders `DeleteDoctorDialog` with `doctor`, `open`, and `onOpenChange` props.
3. In `DeleteDoctorDialog`, clicking **Remove** runs `handleConfirm`.
4. `handleConfirm` calls `mutateAsync({ id: String(doctor.doctorPublicId) })` from the generated `useDeleteDoctorById` hook.
5. The generated client sends `PATCH /api/v1/doctors/{id}/deactivate`.
6. Backend `DeleteDoctorEndpoint` requires `AuthConstants.AdminPolicy`, then calls `DeleteDoctorHandler`.
7. `DeleteDoctorHandler` finds doctor by `PublicId`, sets `DeletedAt` on both doctor and linked user, and saves changes.
8. Frontend receives success, shows success toast, invalidates the doctors list query key (`getGetAllQueryKey()`), and closes the dialog.
9. If API returns an error, the dialog catches `ApiError` and shows backend ProblemDetails title if present.

## Frontend Code
From `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx`:
```tsx
const { mutateAsync, isPending } = useDeleteDoctorById();

await mutateAsync({ id: String(doctor.doctorPublicId) });
toast.success(`Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""} has been removed.`);
await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
onOpenChange(false);
```
This is the main mutation path: perform delete, show success, refresh cached doctor list, then close modal.

From `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx`:
```tsx
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data?.title ?? "Failed to delete doctor.");
  } else {
    toast.error("Failed to delete doctor.");
  }
}
```
This is defensive error handling: use backend-provided ProblemDetails title when available, fallback to a generic message otherwise.

From `frontend/src/api/generated/doctors/doctors.ts`:
```ts
export const getDeleteDoctorByIdUrl = (id: string,) => {
  return `/api/v1/doctors/${id}/deactivate`
}

export const deleteDoctorById = async (id: string, options?: RequestInit): Promise<deleteDoctorByIdResponse> => {
  return ofetchMutator<deleteDoctorByIdResponse>(getDeleteDoctorByIdUrl(id), {
    ...options,
    method: 'PATCH'
  });
}
```
This is generated API-first code (Orval output) proving the exact endpoint and HTTP method used by the dialog.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Doctors/DeleteDoctor/DeleteDoctorEndpoint.cs`:
```csharp
group
    .MapPatch(ApiEndpoints.Doctors.SoftDeleteById,
        async ([FromRoute] Guid id, DeleteDoctorHandler handler, CancellationToken ct) =>
        {
            await handler.HandleAsync(id, ct);
            return TypedResults.NoContent();
        })
    .RequireAuthorization(AuthConstants.AdminPolicy);
```
This maps the PATCH route and enforces admin-only authorization before delete logic runs.

From `backend/src/TeleHealth.Api/Features/Doctors/DeleteDoctor/DeleteDoctorHandler.cs`:
```csharp
var doctor = await db
    .Doctors.Include(d => d.User)
    .FirstOrDefaultAsync(d => d.PublicId == doctorPublicId, ct);

var now = SystemClock.Instance.GetCurrentInstant();

doctor.DeletedAt = now;
doctor.User.DeletedAt = now;

await db.SaveChangesAsync(ct);
```
This is a soft delete: records are not hard-deleted; they are marked with `DeletedAt` using NodaTime `Instant`.

From `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs`:
```csharp
public const string SoftDeleteById = $"{Base}/{{id:guid}}/deactivate";
```
This route constant aligns exactly with the generated frontend URL.

## End-to-End Code Flow
1. User action: admin clicks remove on a doctor row.
2. UI state: `AdminDoctorsPage` stores selected doctor and opens `DeleteDoctorDialog`.
3. Frontend mutation: `DeleteDoctorDialog` calls generated `useDeleteDoctorById` mutation.
4. Request: frontend sends `PATCH /api/v1/doctors/{doctorPublicId}/deactivate`.
5. Authorization + endpoint: backend route requires `AuthConstants.AdminPolicy` and invokes handler.
6. Persistence: handler soft-deletes doctor + linked user by setting `DeletedAt`, then saves.
7. Response: backend returns `204 No Content` on success.
8. Frontend post-success: success toast + doctors query invalidation + dialog close.
9. Frontend error path: shows ProblemDetails title or generic failure toast.

## Important Details
- The dialog returns `null` if `doctor` prop is missing, which prevents accidental mutation calls without a selected record.
- `isPending` disables the remove button and changes button text to `Removing...`, preventing double-submits.
- Cache invalidation uses `getGetAllQueryKey()` so the doctors table refreshes from server data after deletion.
- The operation is a soft delete (deactivation), matching the UI text and backend conventions.
- Route-level authorization is explicit and policy-based (`AdminPolicy`) rather than raw role strings.

## Beginner Programmer Notes
- **Generated hook**: `useDeleteDoctorById` comes from Orval-generated code, so frontend and backend stay in sync with OpenAPI.
- **Mutation**: In TanStack Query, a mutation is an API call that changes server data (create/update/delete).
- **Invalidate query**: `invalidateQueries` marks cached data stale so React Query refetches fresh doctors.
- **Soft delete**: Instead of removing row data forever, app marks it inactive with `DeletedAt`, which is safer for audit/history.
