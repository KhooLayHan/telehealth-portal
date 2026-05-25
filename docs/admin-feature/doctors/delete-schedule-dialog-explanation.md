# Delete Schedule Dialog (Admin Manage Doctors)

## Short Version
This dialog is a safety step before an admin removes a doctor’s schedule slot. It shows the date, time, status, and basic context, then only allows deletion if the slot is **Available** or **Blocked**. When deletion succeeds, it refreshes the daily schedule list and shows a success message; if it fails, it shows an error message.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx` | Main UI component and deletion logic. |
| `frontend/src/api/generated/schedules/schedules.ts` | Generated API mutation hook (`useDeleteById`) and query key helper used for cache refresh. |

## What Happens
1. The component receives three props: whether the dialog is open, which schedule slot is selected, and a callback to close/open the dialog.
2. If no slot is selected, the component returns nothing (`null`) so no dialog appears.
3. It checks if the slot can be removed. Only status values that become `available` or `blocked` after lowercasing are accepted.
4. If the user confirms:
   - It first checks for a missing `publicId` and stops early with a toast error if missing.
   - It checks if the slot is removable and stops with a toast error if not.
   - It calls the generated delete mutation (`useDeleteById`) with the schedule `publicId`.
   - After success, it invalidates the daily schedules query cache using the same date and doctor ID so the UI reloads fresh data.
   - It shows “Schedule removed.” and closes the dialog.
5. If deletion fails, it displays a friendly error toast. If the failure is an `ApiError`, it uses backend-provided error title when available.

## Important Code Snippets
From `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx`:

```tsx
function canRemoveScheduleSlot(scheduleSlot: ReceptionistDoctorScheduleSlotDto): boolean {
  const normalizedStatus = scheduleSlot.scheduleStatus?.toLowerCase();

  return normalizedStatus === "available" || normalizedStatus === "blocked";
}
```

This rule is the core guardrail: only those two statuses can be deleted.

From `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx`:

```tsx
await mutateAsync({ id: scheduleSlot.publicId });
await queryClient.invalidateQueries({
  queryKey: getGetDailySchedulesForReceptionistQueryKey({
    Date: scheduleSlot.date ?? "",
    DoctorPublicId: scheduleSlot.doctorPublicId,
  }),
});
```

After deleting, it explicitly refreshes the relevant schedule query cache so the page does not keep stale values.

From `frontend/src/api/generated/schedules/schedules.ts`:

```ts
export const useDeleteById = <TError = ProblemDetails, TContext = unknown>(...) => {
  return useMutation(getDeleteByIdMutationOptions(options), queryClient);
};
```

This is the generated React Query mutation hook that wraps the backend delete endpoint.

## Code Flow
1. Admin clicks delete on a selected schedule slot.
2. `DeleteScheduleDialog` opens and displays date/time/status summary.
3. Admin clicks **Delete Schedule**.
4. Component validates `publicId` and allowed status.
5. Frontend calls the generated delete API mutation.
6. On success, frontend invalidates daily schedule cache and closes dialog.
7. User sees success toast; on failure, user sees error toast.

## Important Details
- The delete button is disabled when the slot is not removable or while a delete request is in progress.
- During pending state, button text changes to `Deleting...` and shows a loading spinner.
- Date is formatted with `en-MY` locale and time strings are trimmed to `HH:mm` for readability.
- Non-removable slots still show the dialog, but text explains deletion is not allowed and the delete action is disabled.

## In Everyday Words
This dialog prevents accidental or invalid schedule deletions. It confirms what will be deleted, blocks invalid cases, performs the delete safely, refreshes the list immediately, and tells the user clearly whether it worked.
