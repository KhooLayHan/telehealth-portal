# Delete Lab Technician Dialog (Plain English Walkthrough)

## Short Version
This component shows a confirmation popup before an admin removes a lab technician from the active list. When the admin confirms, it sends a backend request to deactivate that lab tech account. If the request succeeds, it shows a success message, refreshes the lab tech list, and closes the popup. If it fails, it shows an error message.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx` | Main dialog component that handles the UI and user actions. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API functions/hooks used by the dialog to call the backend and refresh list data. |

## What Happens
1. The dialog receives three things from its parent component:
   - the selected lab technician record (`labTech`),
   - whether the dialog is open (`open`),
   - and a callback to open/close it (`onOpenChange`).
2. It prepares a mutation hook (`useAdminDeactivateLabTech`) to call the backend endpoint that deactivates the lab technician.
3. If the backend call succeeds:
   - it shows a success toast,
   - invalidates the cached “all lab techs” query so the table/list reloads,
   - and closes the dialog.
4. If the backend call fails:
   - if it is an API error with a server title, it shows that title,
   - otherwise it shows a generic failure message.
5. If no lab tech is selected (`labTech` is null), the component renders nothing.
6. If a lab tech is selected, it renders a destructive-style confirmation dialog with “Cancel” and “Remove” buttons.
7. Clicking “Remove” sends a PATCH request to `/api/v1/admins/lab-techs/{id}/deactivate` using the selected lab tech `publicId`.

## Important Code Snippets
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
This is the core behavior: success and failure handling after the deactivate request.

From `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx`:

```tsx
if (!labTech) return null;
```
This guard prevents the dialog from rendering when there is no selected technician.

From `frontend/src/features/admins/manageLabTech/DeleteLabTechDialog.tsx`:

```tsx
onClick={() => {
  if (labTech.publicId) {
    mutate({ id: labTech.publicId.toString() });
  }
}}
```
This is the action that actually triggers deactivation when the user clicks “Remove”.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminDeactivateLabTechUrl = (id: string,) => {
  return `/api/v1/admins/lab-techs/${id}/deactivate`
}

export const adminDeactivateLabTech = async (id: string, options?: RequestInit): Promise<adminDeactivateLabTechResponse> => {
  return ofetchMutator<adminDeactivateLabTechResponse>(getAdminDeactivateLabTechUrl(id),
  {
    ...options,
    method: 'PATCH'
  }
);
}
```
This shows the exact backend route and HTTP method used by the dialog.

## Code Flow
1. Admin clicks “remove” on a lab tech from a management screen.
2. Parent component opens `DeleteLabTechDialog` and passes in that lab tech.
3. Admin confirms by clicking “Remove”.
4. `mutate({ id })` runs the generated API mutation.
5. Frontend sends `PATCH /api/v1/admins/lab-techs/{id}/deactivate`.
6. On success: success toast + query invalidation + dialog closes.
7. On failure: error toast is shown.

## Important Details
- The component uses `publicId` (external identifier) instead of any internal numeric DB ID.
- The “Remove” button is disabled while the request is in progress (`isPending`) to prevent duplicate clicks.
- Query invalidation ensures the UI fetches fresh data after deactivation.
- “Remove” here means “deactivate account,” not physical deletion.

## In Everyday Words
This popup is a safety check before removing a lab technician from active use. If the admin confirms, the app asks the server to deactivate that account, updates the list, and tells the admin whether it worked.
