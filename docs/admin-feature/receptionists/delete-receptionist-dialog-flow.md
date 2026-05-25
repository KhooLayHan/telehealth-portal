# Delete Receptionist Dialog Flow

## Short Version
This component shows a confirmation popup before an admin removes a receptionist from active use. If the admin confirms, it sends a backend request to deactivate the receptionist account. After success, it refreshes the receptionist list, shows a success message, and closes the popup.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/DeleteReceptionistDialog.tsx` | Main dialog UI and delete flow logic. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hook and endpoint details used by the dialog. |

## What Happens
1. The dialog receives three inputs from its parent: the selected receptionist, whether the dialog is open, and a callback to open/close it.
2. It prepares a mutation hook (`useAdminDeactivateReceptionist`) that will call the backend deactivation endpoint.
3. If the request succeeds:
   - A success toast is shown.
   - The cached receptionist list query is invalidated so the UI fetches fresh data.
   - The dialog closes.
4. If the request fails with an API error, an error toast is shown.
5. The “Remove” button is disabled while the request is in progress, and its text changes to “Removing...”.

## Important Code Snippets
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
This is the core behavior: call the backend, handle success/error, refresh list data, and close the dialog.

From `frontend/src/features/admins/manageReceptionists/DeleteReceptionistDialog.tsx`:

```tsx
onClick={() => {
  if (receptionist.publicId) {
    mutate({ id: receptionist.publicId.toString() });
  }
}}
```
This is the exact trigger. Clicking **Remove** sends the receptionist `publicId` to the API mutation.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminDeactivateReceptionistUrl = (id: string,) => {
  return `/api/v1/admins/receptionists/${id}/deactivate`
}
```
This confirms the backend route being called.

## Code Flow
1. Admin clicks a delete action elsewhere and opens this dialog with a selected receptionist.
2. Dialog shows receptionist name and asks for confirmation.
3. Admin clicks **Remove**.
4. Frontend calls generated mutation hook with receptionist `publicId`.
5. Hook sends a `PATCH` request to `/api/v1/admins/receptionists/{id}/deactivate`.
6. On success, list query is invalidated and refetched, success toast appears, dialog closes.
7. On API failure, error toast appears.

## Important Details
- The component returns `null` when no receptionist is selected, so it cannot run accidentally without a target record.
- The flow uses **soft deactivation** wording (“deactivate”), matching healthcare-safe data handling patterns instead of hard delete behavior.
- Error handling is intentionally user-friendly: it shows a title from backend `ProblemDetails` when available.
- Query invalidation uses `getAdminGetAllReceptionistsQueryKey()` so the receptionist table reflects the latest server state.

## In Everyday Words
This dialog is a safety check before removing a receptionist. If the admin confirms, the app tells the server to deactivate that person, updates the list so the removed person disappears from active records, and gives clear success or error feedback.
