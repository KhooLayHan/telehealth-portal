# Edit Patient Form (Admin) — Plain English Explanation

## Short Version
This file shows a popup form that lets clinic staff edit a patient’s details in one place. It pre-fills the form from the selected patient row, validates the input before saving, sends the update to the backend, then refreshes the patient list so the table shows the newest data. If saving fails, it shows a friendly error toast instead of crashing.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/EditPatientForm.tsx` | Main UI component and all edit/save logic for the dialog form. |
| `frontend/src/api/generated/patients/patients.ts` | Generated API hook (`useUpdatePatientRecord`) and patient-list query key used for refresh after save. |

## What Happens
1. A user selects a patient and opens the edit dialog.
2. The component converts that patient data into form-friendly values (`buildEditPatientValues`) so fields are prefilled.
3. The user edits tabs like Personal, Account, Allergies, and Emergency.
4. On submit, Zod validation (`editPatientSchema`) ensures required fields are present and IC number is exactly 12 digits.
5. If valid, the form builds a clean payload (trimmed text, nullable optional fields) and calls `useUpdatePatientRecord()`.
6. On success, a success toast appears, the patient list query is invalidated (refetched), and the dialog closes.
7. On failure, an error toast appears; if the error is a typed API error, it uses backend-provided title text.

## Important Code Snippets
From `frontend/src/features/admins/managePatients/EditPatientForm.tsx`:

```tsx
const form = useForm({
  defaultValues: buildEditPatientValues(patient),
  validators: { onSubmit: editPatientSchema },
  onSubmit: async ({ value }) => {
    const hasEmergencyContact = value.emergencyContactName.trim().length > 0;
    const updatePayload: UpdatePatientRecordCommand = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      username: value.username.trim(),
      email: value.email.trim(),
      icNumber: value.icNumber.trim(),
      dateOfBirth: value.dateOfBirth,
      phoneNumber: value.phoneNumber.trim() || null,
      gender: value.gender || "N",
      bloodGroup: value.bloodGroup || null,
      emergencyContact: hasEmergencyContact
        ? {
            name: value.emergencyContactName.trim(),
            relationship: value.emergencyContactRelationship.trim(),
            phone: value.emergencyContactPhone.trim(),
          }
        : null,
      allergies: value.allergies.map((allergy) => ({
        allergen: allergy.allergen.trim(),
        severity: allergy.severity,
        reaction: allergy.reaction.trim(),
      })),
    };
```

This is the heart of the save flow: it validates first, then builds a clean backend payload with whitespace trimmed and optional values normalized to `null`.

From `frontend/src/features/admins/managePatients/EditPatientForm.tsx`:

```tsx
try {
  await mutateAsync({
    patientPublicId: patient.patientPublicId,
    data: updatePayload,
  });
  toast.success("Patient details updated successfully");
  await queryClient.invalidateQueries({
    queryKey: getGetAllPatientsForClinicStaffQueryKey(),
  });
  onOpenChange(false);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data.title ?? "Failed to update patient");
    return;
  }

  toast.error("Failed to update patient");
}
```

This block handles both success and failure. On success it refreshes the table data; on error it shows a human-friendly message.

From `frontend/src/api/generated/patients/patients.ts`:

```ts
export const updatePatientRecord = async (
  patientPublicId: string,
  updatePatientRecordCommand: UpdatePatientRecordCommand,
  options?: RequestInit,
): Promise<updatePatientRecordResponse> => {
  return ofetchMutator<updatePatientRecordResponse>(
    getUpdatePatientRecordUrl(patientPublicId),
    {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatePatientRecordCommand),
    },
  );
};
```

This generated function is the actual HTTP call: it sends a `PUT` request with JSON body to update the chosen patient.

## Code Flow
1. **User action:** Admin clicks edit on a patient row.
2. **Dialog rendering:** `EditPatientForm` only renders content when `patient` is not null.
3. **Form init:** `EditPatientFormContent` preloads values from the selected patient.
4. **Validation:** On submit, `editPatientSchema` checks required data and formats.
5. **API update:** `mutateAsync` from `useUpdatePatientRecord` sends a `PUT` update request.
6. **Refresh + UI update:** Query invalidation refetches patient list; dialog closes on success.
7. **Error path:** Toast message is shown and dialog stays open so user can correct/retry.

## Important Details
- The form resets to original patient values when the dialog is closed without saving (`handleOpenChange`), preventing stale unsaved edits from leaking into next open.
- Allergies are handled as a dynamic list and mapped safely to backend shape.
- The request uses `patientPublicId` (external-safe identifier), not internal numeric database IDs.
- Error handling is explicit: typed API errors use server message title; unknown errors use fallback text.

## In Everyday Words
This is the “edit patient profile” popup for admins. It loads the patient’s current info, checks the new input, saves it to the server, refreshes the patient table, and tells the user clearly whether the save worked.
