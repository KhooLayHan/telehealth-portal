# Admin Settings Page (`AdminSettingsPage.tsx`) — Technical Explanation

## Short Version
`AdminSettingsPage` is the admin UI for managing clinic-wide settings: clinic details, default appointment duration, and weekly operating hours. It loads data using the generated `useAdminGetSettings` query hook and saves edits with `useAdminUpdateSettings`. The page keeps separate local edit states per card, validates input on the client with Zod/custom checks, then sends a full `AdminUpdateSettingsCommand` payload to the backend `PUT /api/v1/admins/settings` endpoint.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminSettingsPage.tsx` | Main page component, local edit state, client-side validation, save flows, and rendering behavior. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hooks and request shapes (`useAdminGetSettings`, `useAdminUpdateSettings`, query key, endpoint URLs). |
| `backend/src/TeleHealth.Api/Features/Admins/GetSettings/AdminGetSettingsEndpoint.cs` | Backend GET endpoint mapping, authorization policy, and response contract. |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsEndpoint.cs` | Backend PUT endpoint mapping, authorization, and validation filter wiring. |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsValidator.cs` | Server-side validation rules for clinic details, duration choices, and 7-day operating-hours integrity. |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsHandler.cs` | Database update logic for the singleton settings record and per-day operating-hour updates. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Route constants (`admins/settings`) used by endpoint mappings. |

## Technical Flow
1. The page mounts and calls `useAdminGetSettings()` to fetch the admin settings document.
2. It unwraps the generated response only when status is `200`, then transforms API operating-hour rows into a day-name-indexed UI structure (`OperatingHours`) with `toOperatingHours`.
3. Each card section (Clinic Details, Appointment Settings, Operating Hours) has independent edit mode and draft state, so admins can edit one section at a time.
4. On save:
   - Clinic details are validated with `clinicDetailsSchema` (name + email).
   - Duration is validated with `appointmentDurationSchema` against `[15, 30, 45, 60]`.
   - Hours are validated with `validateOperatingHours` (time format + close > open).
5. If valid, the page constructs a complete `AdminUpdateSettingsCommand` payload (including all 7 days) and calls `useAdminUpdateSettings().mutateAsync`.
6. On success, the query cache is updated and invalidated via `getAdminGetSettingsQueryKey()` so the UI reflects canonical server data.
7. On backend/API errors, `ApiError` titles (Problem Details) are shown with `sonner` toast; fallback toast is used for unknown errors.

## Frontend Code
From `frontend/src/features/admins/AdminSettingsPage.tsx`:

```tsx
const settingsQuery = useAdminGetSettings();
const settings = settingsQuery.data?.status === 200 ? settingsQuery.data.data : null;
const hours = settings ? toOperatingHours(settings) : null;
```

This uses the generated query hook and only accepts the data payload when the HTTP wrapper status is `200`.

```tsx
const { mutateAsync: updateSettings, isPending: isSaving } = useAdminUpdateSettings({
  mutation: {
    onSuccess: async (response) => {
      if (response.status === 200) {
        queryClient.setQueryData(getAdminGetSettingsQueryKey(), response);
      }

      await queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
    },
  },
});
```

This mutation writes optimistic-ish cache data then forces a refetch of the same query key, which keeps the page consistent with backend truth.

```tsx
const clinicDetailsSchema = z.object({
  clinicName: z.string().trim().min(1).max(100),
  supportEmail: z.string().trim().email(),
});
```

Client-side schema validation catches obvious input issues before network calls. The backend still re-validates.

```tsx
function toSettingsCommand(settings: AdminSettingsDto, hours: OperatingHours): AdminUpdateSettingsCommand {
  return {
    clinicName: settings.clinicName,
    supportEmail: settings.supportEmail,
    defaultAppointmentDurationMinutes: settings.defaultAppointmentDurationMinutes,
    operatingHours: DAYS.map((day, index) => ({
      dayOfWeek: index + 1,
      isOpen: hours[day].open,
      openTime: hours[day].open ? toApiLocalTime(hours[day].openTime) : null,
      closeTime: hours[day].open ? toApiLocalTime(hours[day].closeTime) : null,
    })),
  };
}
```

This helper is important: every save operation sends a complete settings command, not a partial patch.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminGetSettingsUrl = () => `/api/v1/admins/settings`
export const getAdminUpdateSettingsUrl = () => `/api/v1/admins/settings`
```

The generated client confirms both read and write operations target the same settings resource path.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/GetSettings/AdminGetSettingsEndpoint.cs`:

```csharp
group.MapGet(ApiEndpoints.Admins.GetSettings, ...)
    .RequireAuthorization(AuthConstants.AdminPolicy);
```

Only users matching `AdminPolicy` can read clinic settings.

From `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsEndpoint.cs`:

```csharp
group.MapPut(ApiEndpoints.Admins.UpdateSettings, ...)
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<AdminUpdateSettingsCommand>>();
```

Writes are admin-only and pass through a validation filter before handler logic runs.

From `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsValidator.cs`:

```csharp
RuleFor(x => x.DefaultAppointmentDurationMinutes)
    .Must(duration => s_allowedDurations.Contains(duration));

RuleFor(x => x.OperatingHours)
    .Must(hours => hours is not null && hours.Count == 7)
    .Must(hours => hours is not null && hours.Select(h => h.DayOfWeek).Distinct().Count() == 7);
```

This enforces the same duration options as the frontend plus strict 7-day uniqueness rules server-side.

From `backend/src/TeleHealth.Api/Features/Admins/UpdateSettings/AdminUpdateSettingsHandler.cs`:

```csharp
var settings = await getSettingsHandler.GetOrCreateSettingsAsync(ct);
settings.ClinicName = cmd.ClinicName.Trim();
settings.SupportEmail = cmd.SupportEmail.Trim();
...
for (short day = 1; day <= 7; day++)
{
    var submittedHour = submittedHours[day];
    var operatingHour = settings.OperatingHours.FirstOrDefault(h => h.DayOfWeek == day)
        ?? AddOperatingHour(settings, day);

    operatingHour.IsOpen = submittedHour.IsOpen;
    operatingHour.OpenTime = submittedHour.IsOpen ? submittedHour.OpenTime : null;
    operatingHour.CloseTime = submittedHour.IsOpen ? submittedHour.CloseTime : null;
}
await db.SaveChangesAsync(ct);
```

The handler updates a singleton settings record and normalizes all seven days on each update.

## End-to-End Code Flow
1. **User action**: Admin opens Settings page.
2. **Frontend fetch**: `useAdminGetSettings()` calls `GET /api/v1/admins/settings`.
3. **Backend read endpoint**: `AdminGetSettingsEndpoint` enforces `AuthConstants.AdminPolicy`, then returns `AdminSettingsDto`.
4. **UI rendering**: Page shows values and allows edit toggles per section.
5. **Validation before save**: Zod/custom logic validates drafts.
6. **Frontend mutation**: `useAdminUpdateSettings` sends `PUT /api/v1/admins/settings` with full command body.
7. **Backend write endpoint**: Validation filter + `AdminUpdateSettingsValidator` run first.
8. **Handler persistence**: `AdminUpdateSettingsHandler` updates setting fields and each day’s operating hours, then saves.
9. **Frontend sync**: On success, query cache is updated/invalidated and success toast is shown.

## Important Details
- **Two-layer validation**: frontend validation improves UX; backend validation is the source of truth.
- **Full-object update pattern**: each save sends all settings fields, not just changed fields.
- **Query cache hygiene**: `setQueryData` plus `invalidateQueries` avoids stale UI.
- **Day mapping contract**: UI day names map to backend `dayOfWeek` 1..7.
- **Role protection**: both GET and PUT settings endpoints require `AuthConstants.AdminPolicy`.

## Beginner Programmer Notes
- **Generated hooks** (`useAdminGetSettings`, `useAdminUpdateSettings`) are API wrappers created from OpenAPI. You usually call these instead of hand-writing `fetch`.
- A **mutation** in TanStack Query means “an operation that changes server data” (here, PUT settings).
- A **query key** is the cache identity. Same key means same cached request data.
- A **validator** in backend (`FluentValidation`) is a guaranteed server check even if the frontend is bypassed.
- This page uses a common “editable card” UX: view mode by default, edit mode with Save/Cancel and local draft state.
