# Delete Doctor Dialog (Plain English Explanation)

## Short Version
This component shows a confirmation popup before removing a doctor from active use. If the user confirms, it calls the backend endpoint that deactivates the doctor, then refreshes the doctor list so the UI stays up to date. It also shows success or error messages so admins know what happened.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx` | Main component that renders the dialog and handles delete confirmation logic. |
| `frontend/src/api/generated/doctors/doctors.ts` | Generated API hook and endpoint path used by the dialog (`useDeleteDoctorById`). |

## What Happens
1. The component receives three inputs: the selected doctor, whether the dialog is open, and a callback to open/close the dialog.
2. If there is no selected doctor, it returns nothing (`null`), so no dialog is shown.
3. If the admin clicks **Remove**, `handleConfirm` runs.
4. `handleConfirm` calls the generated mutation hook (`useDeleteDoctorById`) with the selected doctor public ID.
5. On success:
   - It shows a success toast with the doctor name.
   - It invalidates the cached doctor list query (`getGetAllQueryKey`) so React Query refetches fresh data.
   - It closes the dialog.
6. On failure:
   - If the error is an `ApiError`, it tries to show the API error title.
   - Otherwise it falls back to a generic “Failed to delete doctor.” message.

## Important Code Snippets
From `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useDeleteDoctorById();

if (!doctor) return null;
```

This sets up the delete action and prevents the dialog from rendering when no doctor is selected.

From `frontend/src/features/admins/manageDoctors/DeleteDoctorDialog.tsx`:

```tsx
await mutateAsync({ id: String(doctor.doctorPublicId) });
toast.success(`Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""} has been removed.`);
await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
onOpenChange(false);
```

This is the core success flow: call backend, notify user, refresh doctor list cache, and close the popup.

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

This provides user-facing error handling with a specific API message when available.

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

This confirms the action is a **deactivation** API call (PATCH), not a hard delete.

## Code Flow
1. Admin opens the remove-doctor dialog from the doctors management UI.
2. `DeleteDoctorDialog` displays doctor name and confirmation text.
3. Admin clicks **Remove**.
4. `useDeleteDoctorById` sends `PATCH /api/v1/doctors/{id}/deactivate`.
5. If successful, the component refreshes the doctor list query and closes the dialog.
6. If it fails, the component shows an error toast and keeps the dialog behavior safe for retry.

## Important Details
- The remove button is disabled while request is pending (`isPending`) to avoid duplicate submissions.
- UI text says “remove,” but the generated API path shows this is implemented as account deactivation (`/deactivate`).
- Doctor list refresh depends on invalidating `getGetAllQueryKey()`; this keeps list screens in sync after deactivation.

## In Everyday Words
This popup is a safety check before removing a doctor from active use. When confirmed, it tells the server to deactivate that doctor, refreshes the list on screen, and gives the admin a clear success or error message.
