# Edit Doctor Form (Admin) — Plain English Explanation

## Short Version
This component shows a popup form that lets an admin edit a doctor's profile details. It pre-fills the form using the selected doctor's existing data, validates required fields, and sends the updated values to the backend when the admin clicks save. If the update succeeds, the doctor list is refreshed and the popup closes; if it fails, an error toast is shown.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx` | Main component that builds the UI, validation rules, API update call, and success/error behavior |

## What Happens
1. The component receives three props: the selected doctor object, whether the dialog is open, and a callback to open/close it.
2. It defines a validation schema (using Zod) so required fields (like first name, last name, email, specialization, license, department, etc.) must be valid before submit.
3. It converts backend doctor data into form-friendly default values (for example turning nullable values into empty strings and normalizing gender codes).
4. When the modal opens, it fetches department options for a dropdown.
5. The form is split into tabs (Personal, Professional, Address, Qualifications) so admins can edit sections cleanly.
6. On submit, it maps form values into the backend command shape (`UpdateDoctorCommand`) and sends the update request using the generated API hook.
7. On success, it shows a success toast, invalidates the doctor list query cache, and closes the dialog.
8. On failure, it shows a user-friendly error toast (preferring API error title when available).

## Important Code Snippets
From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
const editDoctorSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  icNumber: z.string().min(1, "Required"),
  // ...
  qualifications: z.array(
    z.object({
      degree: z.string().min(1, "Required"),
      institution: z.string().min(1, "Required"),
      year: z.number().int().min(1900, "Min 1900").max(2100, "Max 2100"),
    }),
  ),
});
```
This is the validation guardrail. It ensures the admin cannot submit missing/invalid core data.

From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
const { mutateAsync, isPending } = useUpdateDoctorById();

await mutateAsync({ id: String(doctor.doctorPublicId), data: payload });
toast.success(`Dr. ${doctor.firstName} ${doctor.lastName}'s profile updated.`);
await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
onOpenChange(false);
```
This is the main save flow: call update API, show success message, refresh cached doctor list data, then close modal.

From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
try {
  await mutateAsync({ id: String(doctor.doctorPublicId), data: payload });
  // success behavior...
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data?.title ?? "Failed to update doctor.");
  } else {
    toast.error("Failed to update doctor.");
  }
}
```
This gives clean user feedback during failures and uses backend-provided error title when possible.

## Code Flow
1. **Admin opens edit dialog** from doctor management UI.
2. **Component initializes form** using existing doctor values.
3. **Department list loads** (only when dialog is open).
4. **Admin edits fields** across tabbed sections.
5. **Validation runs on submit** using the schema.
6. **Update API is called** with doctor public ID + payload.
7. **On success:** success toast + query cache refresh + dialog close.
8. **On error:** error toast shown, dialog stays open.

## Important Details
- Gender display values are normalized to form codes (`M`, `F`, `O`, `N`) using a helper before rendering defaults.
- Address is sent as `null` if no street is provided, instead of always sending a partially empty object.
- Qualifications are dynamic list data and are mapped directly into backend format on submit.
- The component uses generated API hooks and query keys, so cache invalidation remains aligned with the generated client layer.

## In Everyday Words
This is the admin “edit doctor profile” popup. It fills in the current info, checks the admin’s input, saves changes to the server, refreshes the list so new values appear, and shows clear success or error messages.
