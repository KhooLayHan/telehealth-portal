# Edit Lab Technician Form (Admin) — Plain English Explanation

## Short Version
This component shows a popup form that lets an admin update a lab technician’s profile, account, and address details. It pre-fills the form using the selected technician’s current data, validates required fields before submit, then sends the update to the backend. If the update succeeds, it shows a success toast, refreshes the lab technician list, and closes the popup. If it fails, it shows an error toast.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx` | Main component that builds UI, validates input, and calls the update API mutation. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hook that confirms update call shape (`id` + `data`) and query invalidation key usage. |

## What Happens
1. **The dialog only renders when a lab technician is selected.**
   - `EditLabTechForm` receives `labTech`, `open`, and `onOpenChange`.
   - If `labTech` is `null`, it returns `null` (nothing is shown).

2. **The form starts with existing values.**
   - `buildEditDefaultValues` copies values from `labTech` into form fields.
   - It safely handles missing optional fields (phone, address, date of birth) by using empty strings.

3. **Validation runs before submit.**
   - Zod schema requires first name, last name, username, email, IC number, and gender.
   - IC number must be exactly 12 digits.
   - Errors are converted into UI-friendly `{ message }` objects with `toFieldErrors`.

4. **The form is split into 3 tabs for better editing.**
   - Personal: names, IC number, phone, gender, date of birth.
   - Account: username, email.
   - Address: street/city/state/postal code/country.

5. **Submit sends a mutation to the backend.**
   - On submit, it checks `labTech.publicId` first.
   - Then it calls `mutateAsync({ id, data })` using `useAdminUpdateLabTech`.
   - Address is sent as `null` if street is empty, otherwise an address object is sent.

6. **After submit, success and failure are handled clearly.**
   - Success: show success toast, invalidate lab tech list query cache, close dialog.
   - Error: if it is `ApiError`, show backend message title when available; otherwise show generic error.

7. **Closing without saving resets the form.**
   - `handleOpenChange(false)` resets to original defaults so unsaved edits are discarded.

## Important Code Snippets
From `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx`:

```tsx
const editLabTechSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Must be a valid email"),
  icNumber: z
    .string()
    .min(1, "IC number is required")
    .regex(/^\d{12}$/, "IC number must be exactly 12 digits without dashes"),
  gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
});
```
This is the guardrail block: it prevents bad or incomplete data from being sent.

From `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminUpdateLabTech({
  mutation: {
    onSuccess: async () => {
      toast.success("Lab technician updated successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
      onOpenChange(false);
    },
  },
});
```
This is the success path: notify user, refresh list data, then close modal.

From `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx`:

```tsx
await mutateAsync({
  id: labTech.publicId,
  data: {
    firstName: value.firstName,
    lastName: value.lastName,
    username: value.username,
    email: value.email,
    icNumber: value.icNumber,
    phoneNumber: value.phoneNumber || null,
    gender: value.gender,
    dateOfBirth: value.dateOfBirth,
    address: value.street
      ? {
          street: value.street,
          city: value.city,
          state: value.state,
          postalCode: value.postalCode,
          country: value.country,
        }
      : null,
  },
});
```
This is the payload mapping block: it transforms form values into the backend contract shape.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
const mutationFn: MutationFunction<..., {id: string;data: AdminUpdateLabTechCommand}> = (props) => {
  const {id,data} = props ?? {};
  return adminUpdateLabTech(id,data,requestOptions)
}
```
This confirms the generated API contract expects two parts: the lab tech ID and the update body.

## Code Flow
1. Admin clicks edit on a lab technician row.
2. `EditLabTechForm` opens and pre-fills fields from selected `labTech`.
3. Admin updates values in Personal/Account/Address tabs.
4. TanStack Form + Zod validate inputs on submit.
5. `useAdminUpdateLabTech` sends `{ id, data }` to backend.
6. On success, cache is invalidated so the list reloads with updated data.
7. Dialog closes; on failure, user gets an error toast.

## Important Details
- The component uses `key={labTech.publicId}` when rendering content, which helps force remount when switching to another technician.
- The Save button is disabled while submit is invalid or in progress (`!canSubmit || isSubmitting || isPending`).
- The form reset on close prevents stale unsaved data from leaking into the next open.
- `ApiError` handling prefers backend-provided error title when available.

## In Everyday Words
This popup is the admin’s “edit profile card” for lab technicians. It starts with existing info, checks required fields, saves changes to the server, refreshes the list, and gives clear success/error feedback.
