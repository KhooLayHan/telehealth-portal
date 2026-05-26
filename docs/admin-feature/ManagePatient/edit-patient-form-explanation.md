# EditPatientForm.tsx Code Flow Explanation

## Short Version
`EditPatientForm.tsx` renders an admin dialog that lets clinic staff update an existing patient record in four tabs: personal info, account info, allergies, and emergency contact. It uses TanStack Form + Zod for frontend validation, then calls the generated `useUpdatePatientRecord` mutation hook to send a `PUT` request to `/api/v1/patients/{patientPublicId}/record`. After success, it invalidates the `getAllPatientsForClinicStaff` query key so the patient table refetches fresh data and closes the modal.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/EditPatientForm.tsx` | Main component: field schema, form state, payload mapping, mutation call, and dialog UI. |
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Shows where this form is mounted and how selected patient/open state are passed in. |
| `frontend/src/api/generated/patients/patients.ts` | Contains generated query key helper and mutation hook used by the form. |

## Technical Flow
1. **Parent page opens the edit form**: `AdminPatientsPage` stores `editingPatient` and `editPatientOpen`, then renders `<EditPatientForm patient={editingPatient} open={editPatientOpen} ... />`.
2. **Guard clause prevents null rendering**: `EditPatientForm` returns `null` if `patient` is `null`, so the form body only mounts when a patient is selected.
3. **Prefill step**: `buildEditPatientValues(patient)` converts a `ClinicStaffPatientDto` into form defaults (including flattening `emergencyContact` and allergy rows).
4. **Validation step**: `editPatientSchema` (Zod) validates all key fields on submit (first name, last name, username, email, IC number format, etc.).
5. **Submit transform step**: `onSubmit` trims fields, converts empty optional values to `null`, and builds an `UpdatePatientRecordCommand` payload.
6. **API write step**: `mutateAsync({ patientPublicId, data })` (from `useUpdatePatientRecord`) sends the update request.
7. **Refresh step**: on success, `invalidateQueries` with `getGetAllPatientsForClinicStaffQueryKey()` forces the patient list query to refetch.
8. **UX feedback step**: success uses `toast.success`; API errors use `ApiError` title fallback; dialog closes on success.
9. **Cancel/close behavior**: closing resets form values back to the current patient values so unsaved changes are discarded.

## Frontend Code
From `frontend/src/features/admins/managePatients/EditPatientForm.tsx`:

```tsx
const editPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required").max(50, "Username is too long"),
  email: z.string().email("Must be a valid email").max(255, "Email is too long"),
  icNumber: z.string().regex(/^\d{12}$/, "IC number must be exactly 12 digits"),
  ...
});
```
This schema is the frontend safety check. It blocks invalid submit attempts before network calls.

From `frontend/src/features/admins/managePatients/EditPatientForm.tsx`:

```tsx
const { mutateAsync, isPending } = useUpdatePatientRecord();

const form = useForm({
  defaultValues: buildEditPatientValues(patient),
  validators: { onSubmit: editPatientSchema },
  onSubmit: async ({ value }) => {
    const updatePayload: UpdatePatientRecordCommand = { ... };
    await mutateAsync({
      patientPublicId: patient.patientPublicId,
      data: updatePayload,
    });
  },
});
```
This is the central form pipeline: initialize, validate, transform to backend contract, then mutate.

From `frontend/src/features/admins/managePatients/EditPatientForm.tsx`:

```tsx
await queryClient.invalidateQueries({
  queryKey: getGetAllPatientsForClinicStaffQueryKey(),
});
```
This invalidation tells TanStack Query to refresh cached patient list data after editing.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
const handleEditPatient = (patient: ClinicStaffPatientDto) => {
  setEditingPatient(patient);
  setEditPatientOpen(true);
};

<EditPatientForm
  patient={editingPatient}
  open={editPatientOpen}
  onOpenChange={setEditPatientOpen}
/>
```
This shows where edit mode starts: selecting a row sets state and opens the modal.

## Backend Code (as traced via generated client)
From `frontend/src/api/generated/patients/patients.ts`:

```ts
export const getUpdatePatientRecordUrl = (patientPublicId: string,) => {
  return `/api/v1/patients/${patientPublicId}/record`
}

export const updatePatientRecord = async (
  patientPublicId: string,
  updatePatientRecordCommand: UpdatePatientRecordCommand,
  options?: RequestInit
): Promise<updatePatientRecordResponse> => {
  return ofetchMutator<updatePatientRecordResponse>(getUpdatePatientRecordUrl(patientPublicId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(updatePatientRecordCommand)
  });
}
```
This generated client confirms the exact endpoint + HTTP method used by the form. In this task, we traced to generated API wrapper level (not backend handler source).

## End-to-End Code Flow
1. Admin clicks **Edit** from patient table row in `AdminPatientsPage`.
2. `editingPatient` state is set and `EditPatientForm` opens.
3. `EditPatientFormContent` preloads patient data into TanStack Form defaults.
4. User edits fields across tabs (Personal/Account/Allergies/Emergency).
5. Submit triggers Zod `editPatientSchema` validation.
6. If valid, component builds `UpdatePatientRecordCommand` and calls `useUpdatePatientRecord().mutateAsync`.
7. Generated client sends `PUT /api/v1/patients/{patientPublicId}/record`.
8. On success, toast shown + patient list query invalidated + modal closed.
9. On failure, API title or generic error toast is shown.

## Important Details
- **Array form pattern**: allergy rows use `mode="array"` and `field.pushValue/removeValue` for dynamic items.
- **Stable row keys**: `allergyKeysRef` avoids unstable React keys when adding/removing allergy rows.
- **Optional-to-null mapping**: empty optional values (`phoneNumber`, `bloodGroup`, emergency contact block) are normalized before API call.
- **Form reset on close**: closing without save discards edits and reloads selected patient values.
- **Cache consistency**: explicit query invalidation avoids stale table data after successful mutation.

## Beginner Programmer Notes
- **TanStack Form** manages field state and submit lifecycle.
- **Zod schema** is a declarative rules object for validating input shape and constraints.
- **Mutation hook** (`useUpdatePatientRecord`) is the write operation wrapper around an HTTP request.
- **Query invalidation** means “mark old cached data stale and fetch updated server data.”
- **Generated API client** (`patients.ts`) is machine-generated from backend OpenAPI; UI code should consume it rather than writing raw fetch calls.
