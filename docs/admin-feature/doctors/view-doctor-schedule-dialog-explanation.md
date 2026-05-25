# Doctor Schedule Dialog (Admin) — Plain English Explanation

## Short Version
This dialog lets an admin view one doctor’s schedule for a selected date, including which slots are open, blocked, or already booked. It also shows appointment details (like patient name and reason) when available. From the same screen, admins can open a form to add schedule slots and can remove only slots that are still `available` or `blocked`.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx` | Main UI component that loads data, calculates summary values, and renders table/daily views with remove actions. |
| `frontend/src/features/schedules/ScheduleUtils` (imported) | Supplies date helpers used for day navigation (`addDays`) and default date (`getTodayStr`). |
| `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm` (imported) | Modal form opened from this dialog to add schedule entries. |
| `frontend/src/features/admins/manageDoctors/DeleteScheduleDialog` (imported) | Confirmation dialog used when removing an eligible schedule slot. |
| `frontend/src/api/generated/schedules/schedules` (imported hook) | Generated API hook that fetches the daily schedule from backend. |

## What Happens
1. The component receives a selected doctor and whether the dialog is open.
2. It starts with today’s date and fetches schedules only when:
   - the dialog is open, and
   - the doctor has a `doctorPublicId`.
3. It computes quick metrics from returned slots:
   - total slots,
   - available slots,
   - booked slots,
   - blocked slots,
   - and the next booked slot.
4. It renders two viewing modes:
   - **Schedule Slots**: card view on small screens + table on large screens.
   - **Daily View**: grouped sections by date.
5. When “Remove Schedule” is clicked, it only proceeds for `available` or `blocked` slots.
6. Two child dialogs are controlled from this component:
   - **AddDoctorScheduleForm** for creating schedules.
   - **DeleteScheduleDialog** for confirming deletion of a selected slot.

## Important Code Snippets
From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
const scheduleQuery = useGetDailySchedulesForReceptionist(
  { Date: selectedDate, ...(doctorPublicId ? { DoctorPublicId: doctorPublicId } : {}) },
  { query: { enabled: open && Boolean(doctorPublicId) } },
);
```
This is the key data load. It requests schedule data for the chosen date and doctor, and safely avoids fetching if the dialog is closed or doctor ID is missing.

From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
function canRemoveScheduleSlot(slot: ReceptionistDoctorScheduleSlotDto): boolean {
  return isScheduleStatus(slot, "available") || isScheduleStatus(slot, "blocked");
}
```
This is the business rule for deletion in the UI. Booked/occupied slots are intentionally protected.

From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
const hasLoadError = scheduleQuery.isError || scheduleQuery.data?.status === 401;
```
This decides when to show a failure state, including unauthorized responses.

From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
const groupedSlots = scheduleSlots.reduce<Record<string, ReceptionistDoctorScheduleSlotDto[]>>(
  (groups, slot) => {
    const key = `${getDayLabel(slot.date)}, ${slot.date ?? selectedDate}`;
    groups[key] = [...(groups[key] ?? []), slot];
    return groups;
  },
  {},
);
```
This groups schedule items so the “Daily View” can show date-based sections.

## Code Flow
1. **Admin opens doctor schedule dialog** from doctor management UI.
2. **Component initializes state** (`selectedDate`, modal states, selected slot).
3. **Generated API hook fetches schedule slots** for selected day + doctor ID.
4. **Component derives summary and grouped data** (counts, next booked slot, date groups).
5. **UI renders one of three states**: loading, error/empty, or schedule data.
6. **Admin actions**:
   - Change date with previous/next buttons or date input.
   - Open add schedule modal.
   - Remove eligible slot (opens delete confirmation dialog).
7. **Child dialogs handle add/remove workflows** while this parent controls open/close state and selected slot context.

## Important Details
- The component keeps formatting and fallback values resilient (`Not provided`, `Unknown`, `No appointment`) to avoid broken UI if fields are missing.
- It uses compact helper functions for status-to-badge mapping and time formatting, which keeps render logic readable.
- A stable fallback key is used for slot rows/cards when `publicId` is optional.
- Deletion is guarded both by button disabling and an early return in the click handler, reducing accidental invalid actions.

## In Everyday Words
This screen is a day-by-day planner for a doctor. It helps admins quickly see open, blocked, and booked time slots, inspect patient-related booking context, and safely manage schedule availability without touching booked appointments.
