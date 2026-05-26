# EditDoctorForm Code Flow Explanation

## Short Version

`EditDoctorForm` is the admin dialog for updating an existing doctor's profile. It pre-fills the form from `DoctorListDto`, validates user edits with Zod, sends a generated `UpdateDoctorCommand` through Orval's `useUpdateDoctorById` mutation, and refreshes the doctors list cache when the update succeeds.

On the backend, the request goes to `PUT /api/v1/doctors/{id}`. The endpoint requires `AuthConstants.AdminPolicy`, runs `ValidationFilter<UpdateDoctorCommand>`, and `UpdateDoctorHandler` updates the doctor, linked user profile, department reference, and qualifications in the database.

## Files Reviewed

| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx` | Main React dialog with pre-filled defaults, validation, payload mapping, mutation call, and toasts |
| `frontend/src/api/generated/doctors/doctors.ts` | Generated URL/function/hook for `PUT /api/v1/doctors/{id}` and doctors-list query key helper |
| `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorEndpoint.cs` | Minimal API endpoint mapping, auth policy, validation filter, and response codes |
| `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorCommand.cs` | Backend request DTO/command shape (including NodaTime `LocalDate`) |
| `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorValidator.cs` | Backend FluentValidation rules for every important field |
| `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorHandler.cs` | Database update logic for doctor/user/department/qualifications and duplicate IC check |

## Technical Flow

1. Parent UI opens `EditDoctorForm` with the selected `doctor` record and `open=true`.
2. `buildEditDefaultValues(doctor)` converts that `DoctorListDto` into form defaults.
3. `useAdminGetAllDepartments` runs only when the dialog is open (`enabled: open`) to load department options.
4. TanStack Form uses `editDoctorSchema` as the submit validator.
5. On submit, the component maps form values into `UpdateDoctorCommand`.
6. `useUpdateDoctorById` sends `PUT /api/v1/doctors/{doctorPublicId}`.
7. Backend endpoint authorizes admin access, applies validation, and calls `UpdateDoctorHandler`.
8. Handler finds doctor by `PublicId`, checks duplicate IC number, resolves or creates department, updates user + doctor fields, replaces qualifications, and saves.
9. Frontend shows success toast, invalidates doctors-list query cache via `getGetAllQueryKey()`, and closes the dialog.
10. If API fails, frontend catches `ApiError` and shows backend problem `title` when available.

## Frontend Code

From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
const editDoctorSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  consultationFee: z.number().nonnegative("Must be >= 0").nullable(),
  qualifications: z.array(
    z.object({
      degree: z.string().min(1, "Required"),
      institution: z.string().min(1, "Required"),
      year: z.number().int().min(1900, "Min 1900").max(2100, "Max 2100"),
    }),
  ),
});
```

This is the frontend safety check. It improves UX by catching missing or malformed values before the network request, but backend validation is still the real enforcement point.

From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
function buildEditDefaultValues(doctor: DoctorListDto) {
  return {
    firstName: doctor.firstName ?? "",
    lastName: doctor.lastName ?? "",
    gender: doctorGenderToCode(doctor.gender),
    dateOfBirth: String(doctor.dateOfBirth ?? ""),
    departmentName: doctor.departmentName ?? "",
    qualifications: (doctor.qualifications ?? []).map((q) => ({
      degree: q.degree,
      institution: q.institution,
      year: q.year,
    })),
  };
}
```

This adapter converts API list data into editable form defaults. `doctorGenderToCode` normalizes variants like `"male"`/`"M"` into backend-friendly single-letter codes (`M/F/O/N`).

From `frontend/src/features/admins/manageDoctors/EditDoctorForm.tsx`:

```tsx
const payload: UpdateDoctorCommand = {
  firstName: value.firstName ?? "",
  lastName: value.lastName ?? "",
  icNumber: value.icNumber ?? "",
  gender: value.gender || "N",
  dateOfBirth: value.dateOfBirth ?? "",
  departmentName: value.departmentName ?? "",
  address: value.addressStreet
    ? {
        street: value.addressStreet,
        city: value.addressCity,
        state: value.addressState,
        postalCode: value.addressPostalCode,
        country: value.addressCountry,
      }
    : null,
  qualifications: value.qualifications.map((q) => ({
    degree: q.degree,
    institution: q.institution,
    year: q.year,
  })),
};

await mutateAsync({ id: String(doctor.doctorPublicId), data: payload });
await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
```

This is the main mutation path. The form maps UI state to the generated API request model, sends it with the doctor public id, then invalidates the cached doctors list so the page refreshes with updated data.

From `frontend/src/api/generated/doctors/doctors.ts`:

```ts
export const getUpdateDoctorByIdUrl = (id: string) => {
  return `/api/v1/doctors/${id}`;
};

export const updateDoctorById = async (
  id: string,
  updateDoctorCommand: UpdateDoctorCommand,
  options?: RequestInit,
): Promise<updateDoctorByIdResponse> => {
  return ofetchMutator<updateDoctorByIdResponse>(getUpdateDoctorByIdUrl(id), {
    ...options,
    method: "PUT",
    headers: { "Content-Type": "application/json", ...options?.headers },
    body: JSON.stringify(updateDoctorCommand),
  });
};
```

This generated client is the bridge from React to backend. `useUpdateDoctorById` wraps this in a TanStack Query mutation hook.

## Backend Code

From `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorEndpoint.cs`:

```csharp
group
    .MapPut(
        ApiEndpoints.Doctors.UpdateById,
        async (
            [FromRoute] Guid id,
            [FromBody] UpdateDoctorCommand cmd,
            UpdateDoctorHandler handler,
            CancellationToken ct
        ) =>
        {
            await handler.HandleAsync(id, cmd, ct);
            return TypedResults.NoContent();
        }
    )
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<UpdateDoctorCommand>>();
```

This endpoint receives the route id and JSON body, enforces admin policy, applies command validation, and returns `204 No Content` on success.

From `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorValidator.cs`:

```csharp
RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(255);
RuleFor(x => x.IcNumber).NotEmpty().MaximumLength(20);
RuleFor(x => x.Gender).Must(g => g is "M" or "F" or "O" or "N");
RuleFor(x => x.DepartmentName).NotEmpty().MaximumLength(100);
RuleForEach(x => x.Qualifications).ChildRules(q =>
{
    q.RuleFor(x => x.Degree).NotEmpty().MaximumLength(100);
    q.RuleFor(x => x.Year).InclusiveBetween(1900, 2100);
});
```

This validator is the backend safety net. Even if frontend validation is bypassed, these rules still protect data quality.

From `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorHandler.cs`:

```csharp
var doctor = await db
    .Doctors.Include(d => d.User)
    .Include(d => d.Department)
    .FirstOrDefaultAsync(d => d.PublicId == doctorPublicId, ct);

if (doctor is null)
{
    throw new DoctorNotFoundException(doctorPublicId.ToString());
}

var hasDuplicateIcNumber =
    !string.Equals(doctor.User.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
    && await db.Users.AnyAsync(
        u =>
            u.IcNumber == cmd.IcNumber
            && u.PublicId != doctor.User.PublicId
            && u.DeletedAt == null,
        ct
    );
```

The handler loads the doctor by external id (`PublicId`) and blocks duplicate IC numbers across active users.

From `backend/src/TeleHealth.Api/Features/Doctors/UpdateDoctor/UpdateDoctorHandler.cs`:

```csharp
var department = await db.Departments.FirstOrDefaultAsync(
    dep => dep.Name == cmd.DepartmentName,
    ct
);

if (department is null)
{
    department = new Department
    {
        Slug = cmd.DepartmentName.ToLowerInvariant().Replace(' ', '-'),
        Name = cmd.DepartmentName,
    };
    db.Departments.Add(department);
    await db.SaveChangesAsync(ct);
}

user.DateOfBirth = cmd.DateOfBirth;
user.UpdatedAt = SystemClock.Instance.GetCurrentInstant();
doctor.Qualifications = cmd
    .Qualifications.Select(q => new Qualification(q.Degree, q.Institution, q.Year))
    .ToList();

await db.SaveChangesAsync(ct);
```

If department name does not exist, it is created first. Then user/doctor fields are updated, qualifications are replaced as a new list, timestamps use NodaTime `Instant`, and changes are persisted.

## End-to-End Code Flow

1. Admin opens Edit dialog from doctors management UI.
2. Form loads defaults from selected doctor record.
3. Admin edits values across tabbed sections.
4. Zod validates client-side rules on submit.
5. Generated mutation sends `PUT /api/v1/doctors/{id}` with `UpdateDoctorCommand` body.
6. Backend endpoint authorizes admin and validates request with FluentValidation.
7. Handler updates linked `User` and `Doctor` entities (and possibly `Department`) in `ApplicationDbContext`.
8. Backend returns `204 No Content`.
9. Frontend shows toast, invalidates doctor list cache, and closes dialog.

## Important Details

- The form uses doctor `PublicId` in the route id (`doctor.doctorPublicId`), which matches the project rule that external APIs should use public identifiers.
- `dateOfBirth` is sent as a string from frontend but lands in backend command as `LocalDate` (NodaTime), thanks to server-side model binding/serializer configuration.
- Address is optional as a whole (`null` allowed), but if provided, backend validator requires all address sub-fields.
- Duplicate IC number checks exclude the current doctor's own user and soft-deleted users.
- Department names are dynamically created by the handler when missing, instead of rejecting unknown department input.

## Beginner Programmer Notes

- **Mutation**: a request that changes server data (create/update/delete). Here it is `useUpdateDoctorById`.
- **Query invalidation**: telling TanStack Query cached data is stale, so it refetches fresh data.
- **DTO/Command**: a structured request body class/record (`UpdateDoctorCommand`) passed from frontend to backend.
- **ValidationFilter + FluentValidation**: centralized backend request validation before business logic runs.
- **PublicId vs internal Id**: `PublicId` (GUID) is safe for API routes; database numeric IDs remain internal.
