# Admin Settings Page (Plain-English Walkthrough)

## Short Version
This page lets an admin manage three things for the clinic: clinic details, appointment duration, and weekly operating hours. It loads current settings from the backend, allows editing one section at a time, validates user input before saving, then sends a full settings payload back to the backend. If saving succeeds, it refreshes cached data and shows a success message; if it fails, it shows an error toast.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminSettingsPage.tsx` | Main page component and all local validation/edit/save logic for admin clinic settings. |

## What Happens
1. The page fetches current settings using `useAdminGetSettings()`.
2. The response is transformed into UI-friendly state, especially operating hours (mapping numeric day-of-week values to day names and `HH:mm` time inputs).
3. Each card section (Clinic Details, Appointment Settings, Operating Hours) can be edited separately.
4. Before saving, the page validates input:
   - `clinicName` and `supportEmail` with Zod.
   - appointment duration with a limited set of allowed values.
   - operating hours with a time format check and “closing after opening” check.
5. On save, the page sends an `AdminUpdateSettingsCommand` using `useAdminUpdateSettings()`.
6. On success, it updates/invalidate React Query cache so the latest settings are shown everywhere.
7. The user gets clear success/error toasts.

## Important Code Snippets
From `frontend/src/features/admins/AdminSettingsPage.tsx`:
```tsx
const settingsQuery = useAdminGetSettings();
const settings = settingsQuery.data?.status === 200 ? settingsQuery.data.data : null;
```
This is where the page loads current settings and safely reads the successful payload.

From `frontend/src/features/admins/AdminSettingsPage.tsx`:
```tsx
const clinicDetailsSchema = z.object({
  clinicName: z.string().trim().min(1, "Clinic name is required").max(100, "Name must be 100 characters or fewer"),
  supportEmail: z.string().trim().email("Please enter a valid email address"),
});
```
This validation prevents bad clinic name/email values from being sent.

From `frontend/src/features/admins/AdminSettingsPage.tsx`:
```tsx
if (schedule.closeTime <= schedule.openTime) {
  errors[day] = "Closing time must be after opening time.";
}
```
This protects against invalid daily operating-hour ranges.

From `frontend/src/features/admins/AdminSettingsPage.tsx`:
```tsx
await updateSettings({ data });
onSuccess();
toast.success(successMessage);
```
This is the core “save” action used by all sections.

## Code Flow
1. **Admin opens page** → component renders and starts `useAdminGetSettings()`.
2. **Data arrives** → page derives display values and editable drafts.
3. **Admin clicks Edit** on one section → draft state is populated for that section.
4. **Admin clicks Save** → section-specific validation runs.
5. **If valid** → full update command is built and sent to backend.
6. **If API succeeds** → query cache is updated/invalidated and success toast appears.
7. **If API fails** → error toast appears; edit mode stays so user can fix/retry.

## Important Details
- The page always sends a complete settings command shape via `toSettingsCommand(...)`, including operating hours for all days.
- Day mapping uses `index + 1` (Monday=1 through Sunday=7) when converting UI days to API payload.
- Time input uses browser `HH:mm`; outgoing API time is normalized to `HH:mm:ss`.
- Editing state is isolated per card, so admins can work on one settings area at a time.
- Errors are shown next to the relevant field/day to keep feedback specific.

## In Everyday Words
This page is the admin control panel for clinic setup. It pulls the current setup, lets staff edit it safely with built-in checks, saves changes to the server, and immediately reflects the newest values.
