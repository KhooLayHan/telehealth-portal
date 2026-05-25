# Add New Patient Form (Plain-English Explanation)

## Short Version
This component shows a popup form that lets clinic staff create a brand-new patient account. It first creates the account with required personal fields, then (only if optional details were entered) sends a second request to save medical/contact details like allergies, blood group, phone number, and emergency contact. If everything succeeds, it refreshes the patient list and closes the popup. If something fails, it shows an error toast.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx` | Contains the full UI, validation, submit logic, API calls, and success/error handling for adding a patient. |

## What Happens
1. The dialog opens when `open` is true and closes via `onOpenChange`.
2. A form is initialized with empty default values and Zod validation rules.
3. Required identity/account fields are validated (first name, last name, username, email, password, IC number, gender, date of birth).
4. On submit, it calls `useSignUpPatient` to create the patient account.
5. If signup succeeds (`201`), it checks whether optional data exists (allergies, emergency contact, blood group, phone).
6. If optional data exists, it sends `useUpdatePatientRecord` with the richer profile payload.
7. It shows a success message, invalidates the patient list cache, and closes the dialog.
8. If an API error happens, it shows the server error title (if available); otherwise a generic failure message.

## Important Code Snippets

From `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx`:

```tsx
const form = useForm({
  defaultValues: addPatientDefaultValues,
  validators: { onSubmit: addPatientSchema },
  onSubmit: async ({ value }) => {
    const registerPayload: RegisterPatientCommand = {
      firstName: value.firstName,
      lastName: value.lastName,
      username: value.username,
      email: value.email,
      password: value.password,
      icNumber: value.icNumber,
      gender: value.gender,
      dateOfBirth: value.dateOfBirth,
    };
```

This sets up the form with validation and builds the first API payload using only required account fields.

From `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx`:

```tsx
if (response.status === 201) {
  const { patientPublicId } = response.data;
  const hasAllergies = value.allergies.length > 0;
  const hasEmergencyContact = !!value.emergencyContactName;
  const hasExtraData =
    hasAllergies || hasEmergencyContact || !!value.phoneNumber || !!value.bloodGroup;

  if (hasExtraData) {
    const updatePayload: UpdatePatientRecordCommand = {
      ...
    };

    await updateRecordAsync({
      patientPublicId,
      data: updatePayload,
    });
  }
```

This is the key two-step behavior: create account first, then conditionally update medical/contact record only when optional data is provided.

From `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx`:

```tsx
await queryClient.invalidateQueries({
  queryKey: getGetAllPatientsForClinicStaffQueryKey(),
});
onOpenChange(false);
```

After success, the page refreshes the cached patient list so the new patient appears without a manual reload.

## Code Flow
1. Staff opens **Add New Patient** dialog.
2. Staff fills tabs: **Personal**, optional **Allergies**, optional **Emergency**.
3. Frontend validates required fields with Zod/TanStack Form.
4. Frontend sends signup request (`useSignUpPatient`).
5. If created, frontend optionally sends record update (`useUpdatePatientRecord`) using returned `patientPublicId`.
6. Frontend shows success toast, refreshes patient list query cache, and closes dialog.
7. On failure, frontend shows an error toast.

## Important Details
- The submit button is disabled while invalid or pending, preventing duplicate submissions.
- Allergy entries are dynamic rows with add/remove controls.
- Allergy row keys are stored in `useRef` with `crypto.randomUUID()` so row UI remains stable when editing/removing rows.
- Optional sections do not block account creation; they are saved only when data exists.

## In Everyday Words
This form creates a patient in two passes: first the essential login/profile identity, then extra health/contact details if staff entered them. It gives quick feedback, updates the list automatically, and avoids sending optional medical data when nothing was entered.
