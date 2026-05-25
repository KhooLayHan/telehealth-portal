# Delete Patient Dialog (Admin) — Plain English Explanation

## Short Version
This component shows a confirmation popup before removing a patient from the active patient list. If the user confirms, it sends a backend request to deactivate that patient (a soft delete), then refreshes the patient list so the removed patient disappears from the screen. If anything fails, it shows a clear error toast message.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx` | Main UI component that renders the dialog and runs the delete action. |
| `frontend/src/api/generated/patients/patients.ts` | Generated API hook and query key used to call the deactivate endpoint and refresh patient data. |

## What Happens
1. The dialog only renders if a patient is selected (`patient` is not null).
2. The dialog text clearly asks for confirmation and shows the selected patient's name.
3. When the user clicks **Remove**, the component calls a generated mutation hook (`useSoftDeleteById`) with the patient's `patientPublicId`.
4. If the request succeeds, it shows a success toast and invalidates the staff patient list query cache so React Query fetches updated data.
5. The dialog closes after success.
6. If the request fails, it shows an error toast. If the failure is an API error, it tries to show the backend problem title first.

## Important Code Snippets
From `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useSoftDeleteById();

if (!patient) {
  return null;
}
```

This means the component is wired to the generated “deactivate patient” API mutation, and it does not render at all unless a patient is selected.

From `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx`:

```tsx
await mutateAsync({ patientPublicId: patient.patientPublicId });
toast.success("Patient removed successfully");
await queryClient.invalidateQueries({
  queryKey: getGetAllPatientsForClinicStaffQueryKey(),
});
onOpenChange(false);
```

This is the core success path: call backend, show success message, refresh the patient list cache, close dialog.

From `frontend/src/features/admins/managePatients/DeletePatientDialog.tsx`:

```tsx
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data.title ?? "Failed to remove patient");
    return;
  }

  toast.error("Failed to remove patient");
}
```

This is the failure path. It handles known API failures first, then falls back to a generic error.

From `frontend/src/api/generated/patients/patients.ts`:

```ts
export const getSoftDeleteByIdUrl = (patientPublicId: string,) => {
  return `/api/v1/patients/${patientPublicId}/deactivate`
}
```

The generated hook targets a PATCH endpoint that deactivates a patient rather than hard-deleting them.

## Code Flow
1. Admin opens delete dialog for a selected patient.
2. `DeletePatientDialog` displays warning UI and action buttons.
3. Admin clicks **Remove**.
4. `useSoftDeleteById` sends PATCH request to `/api/v1/patients/{patientPublicId}/deactivate`.
5. On success, the component invalidates the staff patient list query key.
6. React Query refreshes the list, so the deactivated patient no longer appears in active results.
7. A toast confirms success, and the dialog closes.

## Important Details
- This component uses `patientPublicId` (external ID), not database internal IDs.
- The UI prevents duplicate submits while the request is in progress using `isPending` and changing button text to `Removing...`.
- Query invalidation is explicit and scoped to the staff patients list query key.
- The dialog wording says “deactivate” in the description, which matches the backend endpoint intent.

## In Everyday Words
This popup is a safety check before removing a patient from active view. If confirmed, it asks the server to deactivate that patient, refreshes the screen, and tells the user what happened.
