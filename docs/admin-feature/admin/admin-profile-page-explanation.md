# Admin Profile Page (Plain English Walkthrough)

## Short Version
This page shows an admin user their profile and lets them update personal details, contact details, address, profile photo, and password. It starts by loading profile data from the backend, then switches between read-only mode and edit mode depending on user actions. It validates form inputs before saving, shows friendly error/success messages, and refreshes profile data after successful updates.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/profile/AdminProfilePage.tsx` | The UI page component that renders profile sections, edit/view modes, upload controls, and password change controls. |
| `frontend/src/features/profile/UseAdminProfile.tsx` | The logic hook that fetches profile data, validates input, uploads avatar files, calls APIs, and manages page state. |

## What Happens
1. The page calls `UseAdminProfile()` to get all profile data and actions.
2. While profile data is loading, it shows a spinner.
3. If loading fails and no profile object is available, it shows a failure message.
4. Once loaded, the page displays profile cards (identity, personal info, contact info, address, account details, password area).
5. Clicking **Edit Profile** switches the UI into editable fields.
6. Clicking **Save** validates inputs first, then sends the update request.
7. Uploading a photo validates file type and size, uploads directly to S3 using a signed URL, then tells the backend to use that new avatar URL.
8. Clicking **Change Password** opens password fields; saving validates rules and sends a password-change request.

## Important Code Snippets

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
  fileInputRef,
  handleFileChange,
  triggerFileSelect,
  handleEdit,
  handleCancel,
  handleFieldChange,
  handleSave,
  isChangingPassword,
  isSavingPassword,
  passwordData,
  passwordErrors,
  handleOpenPasswordChange,
  handleCancelPasswordChange,
  handlePasswordFieldChange,
  handleSavePassword,
} = UseAdminProfile();
```
This is the page’s “control center”: UI state and actions are centralized in one hook so the component stays focused on display.

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
This provides clear user feedback for both loading and failure states.

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```tsx
const profileQuery = useGetMe<AdminMeData>({
  query: {
    select: (response) => response.data as unknown as AdminMeData,
  },
});
```
This is where profile data is fetched from the backend (`/me` style user endpoint through generated API hooks).

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```tsx
const errors = validateProfile(formData);
if (Object.keys(errors).length > 0) {
  setFormErrors(errors);
  return;
}
```
Before saving, the page blocks invalid data and shows field-level error messages.

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```tsx
const uploadResponse = await getAvatarUploadUrl({ contentType: file.type });
const { publicUrl, uploadUrl } = uploadResponse.data as unknown as AvatarUploadResponse;

const s3Response = await fetch(uploadUrl, {
  method: "PUT",
  body: file,
  headers: { "Content-Type": file.type },
});

await updateAvatar({ avatarUrl: publicUrl });
```
Avatar upload is done in two steps: get a signed upload URL, upload file directly to S3, then update the profile avatar URL in backend records.

From `frontend/src/features/profile/UseAdminProfile.tsx`:
```tsx
await changePassword({
  currentPassword: passwordData.currentPassword,
  newPassword: passwordData.newPassword,
});
```
Password changes are sent only after client-side password rule checks pass.

## Code Flow
1. **User opens Admin Profile page**.
2. `AdminProfilePage` renders and calls `UseAdminProfile`.
3. `UseAdminProfile` calls `useGetMe` to fetch current user profile.
4. On success, hook stores profile in local state and prepares editable form values.
5. UI shows cards with read-only values by default.
6. If user clicks **Edit Profile**, fields become editable and validation errors are reset.
7. On **Save**, `validateProfile` runs; if valid, `updateProfile` API is called.
8. Hook updates local state, invalidates cached `getMe` query, exits edit mode, and shows success toast.
9. If user uploads image, hook validates MIME type/size, uploads to signed S3 URL, then calls `updateAvatar` and refreshes cached profile data.
10. If user changes password, `validatePassword` runs; on success, `changePassword` API is called; on 401, current-password error is shown.

## Important Details
- The page uses a **single source of truth hook** (`UseAdminProfile`) so UI and business logic are cleanly separated.
- Client-side validation prevents obvious bad input (invalid name format, phone length, IC length, password strength).
- API errors are converted into user-friendly toast messages (`getErrorMessage`).
- Avatar uploads allow only JPG/PNG/WebP and max 5MB.
- After successful updates, TanStack Query cache is invalidated so future reads use fresh backend data.
- Password fields support show/hide toggling with eye icons and include separate validation/error state from profile form fields.

## In Everyday Words
This page is your admin account settings page. It first loads your current information, then lets you safely edit it with checks for mistakes before anything is saved. It also handles profile photo uploads and password updates in a guided, user-friendly way, with clear success/failure messages.
