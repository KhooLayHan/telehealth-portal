# AddDoctorScheduleForm.tsx Technical Explanation

## Short Version
`AddDoctorScheduleForm` is the admin/receptionist modal used to create one doctor schedule slot for a selected date and start time. It uses TanStack Form for form state, generated Orval hooks (`useAdminGetSettings`, `useCreateSchedule`) for API calls, and client-side checks to ensure the slot stays inside clinic operating hours before sending data. On success, it refreshes the daily schedule query cache and closes/reset the dialog.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx` | Main form component, local validation helpers, submission flow, and UI state. |
| `frontend/src/api/generated/schedules/schedules.ts` | Generated API mutation hook and query-key helper used by this form. |
| `frontend/src/api/generated/admins/admins.ts` | Generated admin settings query hook used to fetch appointment duration and operating hours. |
| `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleEndpoint.cs` | Backend route and auth policy for schedule creation. |
| `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleValidator.cs` | Backend safety-net validation for date, time range, and allowed status values. |
| `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleHandler.cs` | Backend database logic: doctor lookup, status lookup, overlap detection, save, and response DTO. |
| `backend/src/TeleHealth.Api/Features/Admins/GetSettings/AdminGetSettingsEndpoint.cs` | Backend route and auth policy for admin settings lookup. |
| `backend/src/TeleHealth.Api/Features/Admins/GetSettings/AdminGetSettingsHandler.cs` | Source of default appointment duration and operating hours consumed by the frontend. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Route constants proving both frontend calls target `/admins/settings` and `/schedules`. |

## Technical Flow
1. **Dialog opens** with a selected doctor and default date (`open`, `doctor`, `defaultDate` props).
2. The component fetches clinic settings through `useAdminGetSettings` only when open (`enabled: open`).
3. It derives:
   - `appointmentDurationMinutes`
   - `operatingHours`
4. User enters `date`, `startTime`, and `scheduleStatus` in a TanStack Form.
5. The form computes `endTime` client-side using `startTime + defaultAppointmentDurationMinutes`.
6. It validates that:
   - slot does not overflow the day,
   - date parses correctly,
   - clinic is open on that weekday,
   - slot fits between that day's `openTime` and `closeTime`.
7. On submit, the form builds `CreateScheduleCommand` and calls generated `useCreateSchedule` mutation.
8. Backend endpoint validates and persists (if no overlap/conflict).
9. Frontend invalidates `getDailySchedulesForReceptionist` cache for that doctor/date and shows success toast.

## Frontend Code
From `frontend/src/features/admins/manageDoctors/AddDoctorScheduleForm.tsx`:

```tsx
const { mutateAsync, isPending } = useCreateSchedule();
const settingsQuery = useAdminGetSettings({
  query: {
    enabled: open,
    staleTime: SCHEDULE_SETTINGS_STALE_TIME_MS,
  },
});
```

This is the key data dependency setup: one generated hook loads settings, another sends create-schedule requests.

```tsx
function getSlotEndTime(startTime: string, durationMinutes: null | number): string {
  const startMinutes = getTimeInputMinutes(startTime);
  if (startMinutes === null || durationMinutes === null || durationMinutes <= 0) {
    return "";
  }
  const endMinutes = startMinutes + durationMinutes;
  return endMinutes >= MINUTES_PER_DAY ? "" : formatTimeInput(endMinutes);
}
```

This helper enforces a same-day slot. Returning `""` means invalid/impossible end time.

```tsx
const payload: CreateScheduleCommand = {
  doctorPublicId: doctor.doctorPublicId,
  date: value.date,
  startTime: normalizeLocalTimeForApi(value.startTime),
  endTime: normalizeLocalTimeForApi(endTime),
  scheduleStatus: value.scheduleStatus.toLowerCase(),
};
await mutateAsync({ data: payload });
await queryClient.invalidateQueries({
  queryKey: getGetDailySchedulesForReceptionistQueryKey({
    Date: value.date,
    DoctorPublicId: doctor.doctorPublicId,
  }),
});
```

This is the end-to-end frontend action: payload creation, mutation call, then targeted cache invalidation so the UI re-fetches fresh schedule data.

From `frontend/src/api/generated/schedules/schedules.ts`:

```ts
export const getCreateScheduleUrl = () => {
  return `/api/v1/schedules`;
};
```

This confirms `useCreateSchedule` posts to `/api/v1/schedules`.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminGetSettingsUrl = () => {
  return `/api/v1/admins/settings`;
};
```

This confirms settings are read from `/api/v1/admins/settings`.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleEndpoint.cs`:

```csharp
group
    .MapPost(ApiEndpoints.Schedules.CreateSchedule, ...)
    .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)
    .AddEndpointFilter<ValidationFilter<CreateScheduleCommand>>();
```

This maps create-schedule to authenticated admin/receptionist users and runs FluentValidation automatically.

From `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleValidator.cs`:

```csharp
RuleFor(x => x.Date)
    .GreaterThanOrEqualTo(SystemClock.Instance.GetCurrentInstant().InUtc().Date)
    .WithMessage("Cannot create schedules for past dates.");
RuleFor(x => x.EndTime).GreaterThan(x => x.StartTime);
```

Even if frontend validation misses something, backend rejects past-date and invalid time ranges.

From `backend/src/TeleHealth.Api/Features/Schedules/CreateSchedule/CreateScheduleHandler.cs`:

```csharp
var overlapsExistingSlot = await db.DoctorSchedules.AnyAsync(
    s =>
        s.DoctorId == doctor.Id
        && s.Date == command.Date
        && s.StartTime < command.EndTime
        && command.StartTime < s.EndTime,
    ct
);

if (overlapsExistingSlot)
{
    throw new OverlappingScheduleSlotException();
}
```

This is the overlap rule that prevents double-booking a doctor's schedule window.

From `backend/src/TeleHealth.Api/Features/Admins/GetSettings/AdminGetSettingsHandler.cs`:

```csharp
settings = new SystemSetting
{
    Slug = SettingsSlug,
    ...
    DefaultAppointmentDurationMinutes = 30,
};
```

If settings do not exist yet, backend auto-creates defaults, which the form then uses for `endTime` calculation.

## End-to-End Code Flow
1. User clicks “Add Schedule” for a doctor in admin doctor-management UI.
2. `AddDoctorScheduleForm` dialog opens and fetches admin settings.
3. User chooses date/time/status; frontend computes end time from appointment duration.
4. Frontend checks operating-hours boundaries for that weekday.
5. Frontend posts `CreateScheduleCommand` to `/api/v1/schedules`.
6. Backend endpoint enforces auth + model validation.
7. Handler verifies doctor exists, status is valid, and slot does not overlap.
8. Handler saves `DoctorSchedule` and returns created slot DTO.
9. Frontend invalidates the daily schedule query and shows success/error toast.

## Important Details
- **Dual validation approach**: frontend gives immediate UX feedback; backend remains final authority.
- **Operating-hours dependency**: frontend relies on `/admins/settings` payload (`operatingHours`, `defaultAppointmentDurationMinutes`) before enabling submit.
- **Auth separation**:
  - settings endpoint requires **admin** policy,
  - schedule creation endpoint allows **admin or receptionist** policy.
- **Cache precision**: invalidation uses date + doctor-specific query key to refresh only affected schedule data.

## Beginner Programmer Notes
- **Generated hooks (Orval)** are typed wrappers around backend endpoints, so component code stays concise and type-safe.
- A **mutation** means a write operation (create/update/delete), while a **query** means read/fetch.
- **TanStack Query invalidation** marks old cache data as stale so the next read re-fetches updated backend state.
- Backend **ValidationFilter + FluentValidation** is the server-side guardrail that runs before handler logic.
