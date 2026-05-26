# Admin Profile Page (`AdminProfilePage.tsx`) Explanation

## Short Version
`AdminProfilePage` is the admin-facing profile screen UI that lets a signed-in admin view and edit personal details, upload a profile photo, and change their password. The component itself focuses on rendering and user interactions, while almost all business logic (validation, API calls, and state transitions) is handled in the companion hook `UseAdminProfile`. Together, they form a clean container/presentation split: `UseAdminProfile` manages data and side effects, and `AdminProfilePage` renders cards, fields, and buttons based on hook state.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/profile/AdminProfilePage.tsx` | Main page component and reusable UI field blocks for profile + password sections. |
| `frontend/src/features/profile/UseAdminProfile.tsx` | Contains API calls, form validation rules, upload flow, save handlers, and local state used by `AdminProfilePage`. |

## Technical Flow
1. `AdminProfilePage` calls `UseAdminProfile()` immediately on render.
2. `UseAdminProfile` runs `useGetMe` (generated API hook) to fetch the current user profile.
3. While loading, the page shows a spinner. If the profile fails or is missing, it shows a failure message.
4. Once loaded, profile data (`me`) is shown in read-only cards (name, contact, address, account details).
5. Clicking **Edit Profile** switches to editable form fields backed by `formData` state.
6. Clicking **Save** runs frontend validation (`validateProfile`), then calls `updateProfile` if valid.
7. Successful save updates local `me` state, updates auth store first-name when needed, invalidates `getMe` query cache, and exits edit mode.
8. Avatar update uses a 2-step API + S3 flow: request signed upload URL, upload file via `fetch PUT`, then call `updateAvatar` with public URL.
9. Password change section is collapsed by default; opening it reveals three controlled password fields with local validation.
10. Submitting password calls `changePassword`; on known `401`, it maps to a specific current-password error.

## Frontend Code

From `frontend/src/features/profile/AdminProfilePage.tsx`:
```tsx
const {
  me,
  isLoading,
  isUploading,
  isEditing,
  isSaving,
  formData,
  formErrors,
  ...
} = UseAdminProfile();
```
This is the key design choice: the page does not own domain logic; it consumes a rich hook contract.

From `frontend/src/features/profile/AdminProfilePage.tsx`:
```tsx
if (isLoading) {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}

if (!me) {
  return <p className="text-destructive text-sm">Failed to load profile.</p>;
}
```
The component has explicit loading and missing-data guards before rendering the main content.

From `frontend/src/features/profile/AdminProfilePage.tsx`:
```tsx
{isEditing ? (
  <Button size="sm" onClick={handleSave} disabled={isSaving}>...</Button>
) : (
  <Button size="sm" variant="outline" onClick={handleEdit}>Edit Profile</Button>
)}
```
Edit mode is a pure state toggle that switches UI and actions.

From `frontend/src/features/profile/AdminProfilePage.tsx`:
```tsx
<input
  ref={fileInputRef}
  type="file"
  accept="image/jpeg,image/png,image/webp"
  className="hidden"
  onChange={handleFileChange}
/>
```
The file input is hidden and triggered via styled buttons (`triggerFileSelect`), while validation/upload logic lives in the hook.

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```ts
const profileQuery = useGetMe<AdminMeData>({
  query: {
    select: (response) => response.data as unknown as AdminMeData,
  },
});
```
This generated TanStack Query hook fetches authenticated profile data and maps the API response into the shape used by the page.

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```ts
const errors = validateProfile(formData);
if (Object.keys(errors).length > 0) {
  setFormErrors(errors);
  return;
}
await updateProfile(payload);
```
Save flow is “validate first, submit second,” so obvious client-side issues are blocked early.

## Backend Code
For this specific request, the backend endpoint files were not traced in this pass, because the entrypoint provided was the frontend page file and its directly imported hook. What *is* confirmed from the hook is that these generated client functions are used:

- `useGetMe`
- `updateProfile`
- `getAvatarUploadUrl`
- `updateAvatar`
- `changePassword`

These come from `@/api/generated/users/users`, which indicates they are API-first generated clients (Orval) and correspond to backend `users` endpoints.

## End-to-End Code Flow
1. Admin opens profile route and `AdminProfilePage` mounts.
2. `UseAdminProfile` fetches profile via `useGetMe`.
3. Component renders read-only cards from `me`.
4. Admin clicks **Edit Profile** → `isEditing=true` and inputs become editable controlled fields.
5. Each keystroke goes through `handleFieldChange`, updating `formData` and clearing that field’s error.
6. Save runs `validateProfile`; if no errors, `updateProfile(payload)` sends normalized data (`emptyToNull` for nullable fields).
7. On success, local state + auth store are updated, query cache invalidated, success toast shown.
8. For avatar: choose file → MIME/size validation → signed URL request → direct S3 PUT → backend avatar update → cache busting URL + invalidation.
9. For password: open panel → fill 3 fields → `validatePassword` enforces complexity + match rules → `changePassword` call.
10. If API returns `401`, current password field gets inline error; otherwise generic API-safe message is shown.

## Important Details
- **Strong separation of concerns:** `AdminProfilePage` is UI-focused; `UseAdminProfile` is behavior-focused.
- **Local validation mirrors expected backend rules:** name format, username constraints, phone/IC/postal formats, password complexity.
- **Cache consistency:** profile-related changes call `invalidateQueries({ queryKey: getGetMeQueryKey() })` to refresh canonical user data.
- **Avatar cache busting:** appends `?t=timestamp` to the public URL after upload to avoid stale image in browser cache.
- **Safer error display:** `getErrorMessage` prefers API problem details but falls back to generic messages.
- **PII caution:** this screen handles sensitive profile fields (email, phone, IC number), so logs/messages must stay generic and avoid exposing sensitive values.

## Beginner Programmer Notes
- A **custom hook** (`UseAdminProfile`) is a reusable function that combines state + effects + handlers for one feature.
- A **generated API client** means frontend request functions are auto-created from backend OpenAPI definitions, reducing manual HTTP code.
- A **controlled input** means the field value comes from React state (`formData`), so the UI always matches state.
- **Query invalidation** in TanStack Query tells the app to re-fetch data because a mutation changed server state.
- The pattern used here is a good example of keeping UI components “dumb” and domain logic “smart.”
