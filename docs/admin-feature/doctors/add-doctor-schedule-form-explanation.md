# Add Doctor Schedule Form (Plain-English Walkthrough)

## Short Version
This form lets an admin create one schedule slot for a specific doctor on a chosen date and time. It automatically calculates the slot end time using clinic settings, checks that the slot is inside operating hours, and then sends the schedule to the backend. If creation succeeds, it refreshes the daily schedules list and closes the modal.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx` | Main UI and form logic for creating a doctor schedule slot. |
| `frontend/src/api/generated/admins/admins.ts` | Generated hook used to load appointment duration and clinic operating hours. |
| `frontend/src/api/generated/schedules/schedules.ts` | Generated mutation and query-key helper used to create and refresh schedules. |

## What Happens
1. When the modal opens, the component fetches admin settings (especially default appointment duration and operating hours).
2. The user picks a date, start time, and status (`Available` or `Blocked`).
3. The form computes an end time by adding duration to the selected start time.
4. The form validates:
   - doctor ID exists,
   - duration settings loaded,
   - end time still fits in the same day,
   - selected time is within clinic operating hours for that weekday.
5. If validation passes, it sends a `CreateScheduleCommand` payload to the backend.
6. On success, it invalidates the “daily schedules for receptionist” query cache, shows a success toast, closes the modal, and resets the form.
7. On failure, it shows an API error message (if available) or a generic fallback.

## Important Code Snippets
From `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx`:

```tsx
const settingsQuery = useAdminGetSettings({
  query: {
    enabled: open,
    staleTime: SCHEDULE_SETTINGS_STALE_TIME_MS,
  },
});
```
This loads settings only while the dialog is open and keeps them fresh for 5 minutes.

From `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx`:

```tsx
const endTime = getSlotEndTime(value.startTime, appointmentDurationMinutes);

const operatingHoursError = getOperatingHoursValidationMessage({
  date: value.date,
  endTime,
  operatingHours,
  startTime: value.startTime,
});
```
This is the core safety check: compute end time first, then ensure the slot fits clinic hours.

From `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx`:

```tsx
const payload: CreateScheduleCommand = {
  doctorPublicId: doctor.doctorPublicId,
  date: value.date,
  startTime: normalizeLocalTimeForApi(value.startTime),
  endTime: normalizeLocalTimeForApi(endTime),
  scheduleStatus: value.scheduleStatus.toLowerCase(),
};
```
This builds the exact request sent to the backend. Times are normalized to include seconds (`HH:mm:ss`).

From `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx`:

```tsx
await queryClient.invalidateQueries({
  queryKey: getGetDailySchedulesForReceptionistQueryKey({
    Date: value.date,
    DoctorPublicId: doctor.doctorPublicId,
  }),
});
```
After creation, this refreshes the doctor’s daily schedule list so the UI shows the new slot right away.

## Code Flow
1. **User action:** Admin opens “Add Schedule” modal for a doctor.
2. **Settings load:** `useAdminGetSettings` fetches duration + operating hours.
3. **Form input:** Admin enters date/start time/status.
4. **Live computed output:** End time is auto-calculated and shown as read-only.
5. **Validation gate:** Form blocks submit if settings are missing, end time is invalid, or slot is outside operating hours.
6. **API write:** `useCreateSchedule` sends the command.
7. **UI refresh:** Query invalidation forces schedule list refresh.
8. **Feedback:** Success or error toast appears.

## Important Details
- The component maps JavaScript weekday values to API weekday format (`Sunday -> 7`, otherwise `1-6`).
- A slot cannot roll into the next day; if it does, end time becomes invalid and submit is blocked.
- The submit button is disabled while loading settings, while submitting, or while validation errors exist.
- API errors are handled through `ApiError` so users see a clearer backend message when available.

## In Everyday Words
This is a guarded “add schedule” popup. It doesn’t just save what the user types—it first checks clinic rules (opening hours and appointment length), then saves only valid slots, and finally refreshes the schedule view so the new slot appears immediately.
