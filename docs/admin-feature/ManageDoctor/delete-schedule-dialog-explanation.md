# DeleteScheduleDialog.tsx Explanation

## Short Version
`DeleteScheduleDialog` is a frontend confirmation modal that lets an admin remove a doctor's schedule slot only when the slot is in `available` or `blocked` status. It calls the generated `useDeleteById` mutation from the schedules API client, then invalidates the daily schedules query key so TanStack Query refetches fresh data. It also handles both expected API errors (`ApiError`) and fallback unknown errors with user-friendly toasts.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx` | Main component being explained; contains validation, deletion mutation call, cache invalidation, and UI states. |
| `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx` | Parent caller that opens this dialog and passes the selected schedule slot. |
| `frontend/src/api/generated/schedules/schedules.ts` | Generated API client source of `useDeleteById` and daily schedule query key helper used for invalidation. |

## Technical Flow
1. A user clicks **Remove Schedule** in `ViewDoctorScheduleDialog`, which stores the chosen slot and opens `DeleteScheduleDialog`.
2. `DeleteScheduleDialog` receives three props:
   - `open`: controls modal visibility.
   - `scheduleSlot`: selected slot details (date/time/status/public IDs).
   - `onOpenChange`: callback to close or open dialog.
3. The dialog computes `isRemovable` using `canRemoveScheduleSlot`, allowing deletion only for `available` or `blocked` statuses.
4. On **Delete Schedule** click, `handleConfirm` performs frontend safety checks:
   - must have `scheduleSlot.publicId`.
   - must be removable based on status.
5. If checks pass, it calls `mutateAsync({ id: scheduleSlot.publicId })` from generated `useDeleteById`.
6. On success, it invalidates `getGetDailySchedulesForReceptionistQueryKey({ Date, DoctorPublicId })` so the schedule list refetches updated rows.
7. It shows success toast and closes the modal.
8. On failure, it checks for `ApiError` and displays the API problem title; otherwise shows a generic failure toast.

## Frontend Code
From `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx`:

```tsx
function canRemoveScheduleSlot(scheduleSlot: ReceptionistDoctorScheduleSlotDto): boolean {
  const normalizedStatus = scheduleSlot.scheduleStatus?.toLowerCase();

  return normalizedStatus === "available" || normalizedStatus === "blocked";
}
```

This helper is the business rule guard in the UI. It normalizes case and allows deletion only for two statuses.

From `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useDeleteById();

await mutateAsync({ id: scheduleSlot.publicId });
await queryClient.invalidateQueries({
  queryKey: getGetDailySchedulesForReceptionistQueryKey({
    Date: scheduleSlot.date ?? "",
    DoctorPublicId: scheduleSlot.doctorPublicId,
  }),
});
```

`useDeleteById` is a TanStack Query mutation wrapper generated from OpenAPI. After deletion, query invalidation forces the daily schedule list to refresh rather than showing stale UI data.

From `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog.tsx`:

```tsx
if (error instanceof ApiError) {
  toast.error(error.data?.title ?? "Failed to remove schedule.");
} else {
  toast.error("Failed to remove schedule.");
}
```

Error handling distinguishes structured API problem responses from unknown runtime errors.

From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
<DeleteScheduleDialog
  open={deleteScheduleOpen}
  scheduleSlot={selectedScheduleSlot}
  onOpenChange={handleDeleteScheduleOpenChange}
/>
```

This shows where the dialog is mounted and how parent state controls it.

## Backend Code
A direct backend endpoint/handler trace for this exact delete call is not shown in the files requested and reviewed here. The frontend uses generated client functions in `frontend/src/api/generated/schedules/schedules.ts`, so the API contract exists, but the corresponding backend slice file path was not traced in this pass.

From `frontend/src/api/generated/schedules/schedules.ts`:

```ts
const mutationFn: MutationFunction<Awaited<ReturnType<typeof deleteById>>, {id: string}> = (props) => {
  const {id} = props ?? {};

  return deleteById(id, requestOptions)
}

export const useDeleteById = <TError = ProblemDetails, TContext = unknown>(...) => {
  return useMutation(getDeleteByIdMutationOptions(options), queryClient);
}
```

This is generated glue code: it transforms `mutateAsync({ id })` into the actual HTTP delete request function.

## End-to-End Code Flow
1. Admin clicks **Remove Schedule** on a doctor schedule slot card.
2. Parent dialog sets `selectedScheduleSlot` and opens `DeleteScheduleDialog`.
3. `DeleteScheduleDialog` renders slot summary (date, time, status, appointment/reason).
4. User confirms deletion.
5. Component checks `publicId` and status eligibility.
6. Generated mutation sends delete request with slot `publicId`.
7. On success, TanStack Query invalidates daily schedule key and data is refetched.
8. UI closes modal and shows success toast; failures show error toast.

## Important Details
- **Status-gated deletion:** UI prevents unsupported deletes by disabling the button and by guard checks inside `handleConfirm`.
- **Dual guard pattern:** Even with disabled button, the handler still validates status and ID before mutation (defensive coding).
- **Cache correctness:** `invalidateQueries` uses both date and doctor public ID, targeting the same query scope used by schedule viewing.
- **User feedback:** `isPending` drives loading spinner and button disabled states, preventing duplicate submissions.

## Beginner Programmer Notes
- **Mutation (TanStack Query):** A mutation is a write action (create/update/delete) sent to the backend.
- **Invalidation:** Marking cached query data as stale so it refetches fresh data.
- **Generated API hook:** `useDeleteById` is auto-generated from OpenAPI; this avoids handwritten request logic.
- **DTO:** `ReceptionistDoctorScheduleSlotDto` is a typed data shape from the API client for schedule slot fields used by the component.
