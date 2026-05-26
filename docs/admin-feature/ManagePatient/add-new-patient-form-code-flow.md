# AddNewPatientForm.tsx Code Flow Explanation

## Short Version
`AddNewPatientForm` is an admin dialog component that creates a patient in two phases: account registration first, then optional record enrichment (allergies, blood group, emergency contact, phone). It uses TanStack Form with Zod for frontend validation, generated Orval mutation hooks for API calls, and TanStack Query invalidation to refresh the staff patient list after success.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx` | Main form UI, validation schema, payload mapping, submit flow, error/success handling |
| `frontend/src/api/generated/auth/auth.ts` | Generated `useSignUpPatient` hook and `/api/v1/auth/signup-patient` request mapping |
| `frontend/src/api/generated/patients/patients.ts` | Generated `useUpdatePatientRecord` hook and patient-list query key invalidation target |
| `backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientEndpoint.cs` | Backend signup-patient endpoint definition and HTTP 201 response shape |
| `backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientHandler.cs` | Creates user + patient records, hashes password, publishes patient-registered event |
| `backend/src/TeleHealth.Api/Features/Patients/UpdatePatientRecord/UpdatePatientRecordEndpoint.cs` | Protected endpoint used to save optional medical/emergency details |
| `backend/src/TeleHealth.Api/Features/Patients/UpdatePatientRecord/UpdatePatientRecordHandler.cs` | Performs uniqueness checks, updates User + Patient fields, persists changes |

## Technical Flow
1. Admin opens the modal and fills three tabs: **Personal**, **Allergies**, **Emergency**.
2. `useForm` runs `addPatientSchema` (Zod) on submit and blocks submission if required fields are missing.
3. The component builds a `RegisterPatientCommand` payload and calls `useSignUpPatient().mutateAsync`.
4. On HTTP `201`, it reads `patientPublicId` from response.
5. If optional data exists (allergies/contact/phone/blood group), it builds `UpdatePatientRecordCommand` and calls `useUpdatePatientRecord().mutateAsync(patientPublicId, payload)`.
6. On success, it shows toast success, invalidates `getGetAllPatientsForClinicStaffQueryKey()`, and closes the dialog.
7. On failure, it catches `ApiError` and shows server-provided title when available.

## Frontend Code
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
This means frontend validation happens before any network call, and only the required registration fields are sent in phase 1.

From `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx`:

```tsx
const hasExtraData =
  hasAllergies || hasEmergencyContact || !!value.phoneNumber || !!value.bloodGroup;

if (hasExtraData) {
  const updatePayload: UpdatePatientRecordCommand = {
    // ... includes bloodGroup, emergencyContact, allergies, phone
  };

  await updateRecordAsync({
    patientPublicId,
    data: updatePayload,
  });
}
```
This conditional creates the second phase only when optional profile/medical fields exist.

From `frontend/src/api/generated/auth/auth.ts`:

```ts
export const getSignUpPatientUrl = () => `/api/v1/auth/signup-patient`
```
So `useSignUpPatient` calls the backend signup route directly.

From `frontend/src/api/generated/patients/patients.ts`:

```ts
export const getUpdatePatientRecordUrl = (patientPublicId: string,) => {
  return `/api/v1/patients/${patientPublicId}/record`
}
```
So the second request targets a specific patient by public GUID.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientEndpoint.cs`:

```csharp
app.MapPost($"{ApiEndpoints.Auth.SignUpPatient}", async (
    RegisterPatientCommand command,
    RegisterPatientHandler handler,
    CancellationToken token) =>
{
    var result = await handler.HandleAsync(command, token);

    return TypedResults.Created(
        $"{ApiEndpoints.Patients.GetById.Replace("{id:guid}", result.PatientPublicId.ToString())}",
        new { result.UserPublicId, result.PatientPublicId }
    );
})
.AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();
```
Backend validates command again via `ValidationFilter`, then returns `201 Created` with both public IDs.

From `backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientHandler.cs`:

```csharp
var user = new User { ... };
user.PasswordHash = passwordHasher.HashPassword(user, cmd.Password);

db.Users.Add(user);
await db.SaveChangesAsync(ct);

var patient = new Patient { PublicId = patientPublicId, UserId = user.Id };
db.Patients.Add(patient);

await publishEndpoint.Publish(new PatientRegisteredEvent(patient.PublicId, SystemClock.Instance.GetCurrentInstant()), ct);
await db.SaveChangesAsync(ct);
```
This is where persistent writes happen: user is created first, then patient row is linked, and an event is published.

From `backend/src/TeleHealth.Api/Features/Patients/UpdatePatientRecord/UpdatePatientRecordEndpoint.cs`:

```csharp
.MapPut(ApiEndpoints.Patients.UpdatePatientRecord, ...)
.RequireAuthorization(AuthConstants.ClinicStaffPolicy)
.AddEndpointFilter<ValidationFilter<UpdatePatientRecordCommand>>();
```
Only clinic staff can execute phase 2 updates, and backend validation is enforced.

## End-to-End Code Flow
1. Admin clicks **Add New Patient** in admin UI.
2. `AddNewPatientForm` collects personal + optional details with TanStack Form.
3. Submit triggers `useSignUpPatient` (`POST /api/v1/auth/signup-patient`).
4. `RegisterPatientEndpoint` receives `RegisterPatientCommand` and calls handler.
5. `RegisterPatientHandler` hashes password, inserts `User` + `Patient`, publishes `PatientRegisteredEvent`, returns `PatientPublicId`.
6. Frontend checks if optional fields exist; if yes, calls `useUpdatePatientRecord` (`PUT /api/v1/patients/{patientPublicId}/record`).
7. `UpdatePatientRecordEndpoint/Handler` authorizes clinic staff, validates, checks duplicates, updates patient/user profile fields, persists.
8. Frontend invalidates staff patient-list query key and closes dialog on success.

## Important Details
- Two-step design prevents overloading registration endpoint with optional profile data.
- Duplicate checks exist in `UpdatePatientRecordHandler` and DB unique constraints are also handled.
- Query invalidation is key: without it, admin list could show stale data.
- Error handling favors API ProblemDetails titles when available.

## Beginner Programmer Notes
- **Generated hook (Orval):** typed wrapper around HTTP endpoints (less manual fetch code).
- **Mutation (TanStack Query):** a write operation (POST/PUT) with pending/error/success state.
- **Validation filter:** backend guard that re-validates request even if frontend already validated.
- **PublicId (GUID):** safe external identifier used in URLs/API instead of internal DB IDs.
