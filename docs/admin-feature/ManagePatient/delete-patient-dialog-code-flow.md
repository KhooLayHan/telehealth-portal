# DeletePatientDialog.tsx Code Flow Explanation

## Short Version
`DeletePatientDialog` is the confirmation modal that lets an admin soft-delete a patient from the **Manage Patients** screen. It calls the generated `useSoftDeleteById` mutation, which sends a `PATCH /api/v1/patients/{patientPublicId}/deactivate` request, then refreshes the staff patient list cache so the table updates. On the backend, `DeletePatientEndpoint` routes the request to `DeletePatientHandler`, which sets `DeletedAt` timestamps (soft delete) on both `Patient` and related `User` records instead of hard-deleting rows.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx` | Main UI component and mutation handling logic for delete confirmation. |
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Shows where this dialog is opened and how the selected patient is passed in. |
| `frontend/src/api/generated/patients/patients.ts` | Generated TanStack Query mutation and URL for the soft-delete API call. |
| `backend/src/TeleHealth.Api/Features/Patients/DeletePatient/DeletePatientEndpoint.cs` | Maps the API route and enforces admin authorization. |
| `backend/src/TeleHealth.Api/Features/Patients/DeletePatient/DeletePatientHandler.cs` | Executes the soft-delete business logic and persistence. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Defines the route constant used by the endpoint. |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Provides the `AdminPolicy` authorization constant. |
| `backend/src/TeleHealth.Api/Domain/Entities/Patient.cs` | Shows `DeletedAt` field used for soft-delete semantics. |

## Technical Flow
1. An admin clicks **Remove** from the patients table actions on `AdminPatientsPage`.
2. `handleRemovePatient` stores that row in `deletingPatient` and opens `DeletePatientDialog`.
3. `DeletePatientDialog` receives `patient`, `open`, and `onOpenChange` props. If no `patient`, it renders `null` for safety.
4. Clicking **Remove** inside the dialog runs `handleConfirmDelete`.
5. `handleConfirmDelete` calls `mutateAsync({ patientPublicId })` from generated `useSoftDeleteById`.
6. Generated client sends `PATCH /api/v1/patients/{patientPublicId}/deactivate`.
7. Backend endpoint (`MapPatch`) receives `patientPublicId`, requires `AdminPolicy`, then calls handler.
8. Handler loads patient + related user, sets both `DeletedAt` values to current NodaTime `Instant`, saves changes.
9. Frontend success path shows toast, invalidates the patient list query key, closes dialog.
10. Error path shows API problem title (if present) or fallback message.

## Frontend Code
From `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useSoftDeleteById();

await mutateAsync({ patientPublicId: patient.patientPublicId });
toast.success("Patient removed successfully");
await queryClient.invalidateQueries({
  queryKey: getGetAllPatientsForClinicStaffQueryKey(),
});
onOpenChange(false);
```

This is the core mutation flow: call API, show success feedback, force patient-list refetch, then close modal.

From `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx`:

```tsx
catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data.title ?? "Failed to remove patient");
    return;
  }

  toast.error("Failed to remove patient");
}
```

This keeps error UX friendly by showing backend ProblemDetails `title` when available.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
const handleRemovePatient = (patient: ClinicStaffPatientDto) => {
  setDeletingPatient(patient);
  setDeletePatientOpen(true);
};

<DeletePatientDialog
  patient={deletingPatient}
  open={deletePatientOpen}
  onOpenChange={setDeletePatientOpen}
/>
```

This shows where the dialog is connected to table actions and state.

From `frontend/src/api/generated/patients/patients.ts`:

```ts
export const getSoftDeleteByIdUrl = (patientPublicId: string,) => {
  return `/api/v1/patients/${patientPublicId}/deactivate`
}

export const softDeleteById = async (patientPublicId: string, options?: RequestInit) => {
  return ofetchMutator(getSoftDeleteByIdUrl(patientPublicId), {
    ...options,
    method: 'PATCH'
  });
}
```

This is the generated API contract used by the mutation hook.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Patients/DeletePatient/DeletePatientEndpoint.cs`:

```csharp
group
    .MapPatch(ApiEndpoints.Patients.SoftDeleteById,
        async (Guid patientPublicId, DeletePatientHandler handler, CancellationToken ct) =>
        {
            await handler.HandleAsync(patientPublicId, ct);
            return TypedResults.NoContent();
        })
    .RequireAuthorization(AuthConstants.AdminPolicy);
```

This binds the route and protects it so only admin-authorized callers can deactivate patients.

From `backend/src/TeleHealth.Api/Features/Patients/DeletePatient/DeletePatientHandler.cs`:

```csharp
var patient = await db
    .Patients.Include(p => p.User)
    .FirstOrDefaultAsync(p => p.PublicId == patientPublicId, ct);

if (patient is null)
{
    Log.Warning("Patient not found. PatientPublicId: {PatientPublicId}", patientPublicId);
    throw new PatientNotFoundException();
}

var now = SystemClock.Instance.GetCurrentInstant();
patient.DeletedAt = now;
patient.User.DeletedAt = now;

await db.SaveChangesAsync(ct);
```

This is a **soft delete**: records remain in DB, but `DeletedAt` marks them inactive.

From `backend/src/TeleHealth.Api/Domain/Entities/Patient.cs`:

```csharp
public Instant? DeletedAt { get; set; }
```

This field is the entity-level marker used for deletion lifecycle.

## End-to-End Code Flow
1. Admin clicks remove on a patient row.
2. AdminPatientsPage sets selected patient and opens DeletePatientDialog.
3. Dialog confirmation triggers `useSoftDeleteById` mutation.
4. Generated API client sends PATCH deactivate request with `patientPublicId` in URL.
5. Backend endpoint validates authorization with `AdminPolicy`.
6. Handler finds patient by `PublicId`; throws not-found exception if missing.
7. Handler sets `DeletedAt` on `Patient` and `User`, then saves.
8. API returns 204 No Content.
9. Frontend shows success toast, invalidates list query key, and the refreshed list excludes the deactivated patient.

## Important Details
- This feature uses **soft delete**, not hard delete, to preserve data history and support audit/compliance needs.
- The external identifier in API calls is `patientPublicId` (GUID), matching project ID strategy (no internal DB ID exposure).
- The mutation uses generated Orval hooks, so request shape and response typing stay aligned with OpenAPI.
- Error handling prefers backend ProblemDetails title for clearer UI feedback.

## Beginner Programmer Notes
- **Mutation**: a TanStack Query operation that changes server data (create/update/delete-like actions).
- **Query invalidation**: tells TanStack Query to refetch cached list data because it may now be stale.
- **Soft delete**: marks a record as inactive (`DeletedAt`) rather than removing row data permanently.
- **Endpoint vs Handler**: endpoint maps HTTP route; handler contains business logic and DB updates.
