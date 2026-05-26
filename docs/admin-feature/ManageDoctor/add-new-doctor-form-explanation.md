# AddNewDoctorForm.tsx Technical Explanation

## Short Version
`AddNewDoctorForm` is the admin dialog that collects doctor profile, account, professional, address, and qualification details, validates them with Zod, then sends a `CreateDoctorCommand` using the generated `useCreateDoctor` mutation. It also fetches department options from the admin departments endpoint and refreshes the doctors list query on success. On the backend, `/api/v1/doctors` is protected by `AdminPolicy`, validated again with FluentValidation, then persisted by creating both a `User` and `Doctor` record in one transactional flow.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx` | Main UI form, frontend validation, payload mapping, mutation, and toast/query behavior |
| `frontend/src/api/generated/doctors/doctors.ts` | Generated hook and HTTP call for `POST /api/v1/doctors`, plus doctors list query key invalidation target |
| `frontend/src/api/generated/admins/admins.ts` | Generated hook for loading department options shown in the select input |
| `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorEndpoint.cs` | Maps create route, auth policy, validation filter, and HTTP 201 response |
| `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorCommand.cs` | Backend request contract and nested address/qualification DTO shapes |
| `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorValidator.cs` | Backend rule enforcement (safety net beyond frontend checks) |
| `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorHandler.cs` | Actual persistence logic: role lookup, department resolve/create, user + doctor insert, uniqueness handling |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllDepartments/AdminGetAllDepartmentsEndpoint.cs` | Admin departments endpoint consumed by the form |
| `backend/src/TeleHealth.Api/Features/Admins/GetAllDepartments/AdminGetAllDepartmentsHandler.cs` | Pagination and ordering used by department options fetch |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Confirms route constants for doctors and admin departments |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Source of `AdminPolicy` used by protected endpoints |

## Technical Flow
1. Admin opens the modal (`open` prop).
2. The form triggers `useAdminGetAllDepartments({ Page: 1, PageSize: 100 }, { enabled: open })` so department options are fetched only while dialog is open.
3. `departmentOptions` is derived from successful response items, filtered for non-empty name, then sorted alphabetically.
4. User fills fields across tab sections (Personal, Professional, Address, Qualifications).
5. TanStack Form validates on submit using `addDoctorSchema` (Zod).
6. Form values are mapped into backend shape `CreateDoctorCommand`, including optional `address` null handling and qualifications array transformation.
7. Frontend calls `mutateAsync({ data: payload })` from generated `useCreateDoctor`.
8. Generated client sends `POST /api/v1/doctors` with JSON body.
9. Backend endpoint requires `AuthConstants.AdminPolicy`, applies `ValidationFilter<CreateDoctorCommand>`, and calls handler.
10. Handler resolves doctor role, resolves/creates department, creates `User` (with hashed password) and `Doctor` records, commits transaction, and returns `doctorPublicId`.
11. On success, frontend shows success toast, invalidates `getGetAllQueryKey()` to refresh doctor list, then closes dialog.
12. On failure, frontend catches `ApiError` and displays server problem title if available.

## Frontend Code
From `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx`:
```tsx
const form = useForm({
  defaultValues: addDoctorDefaultValues,
  validators: { onSubmit: addDoctorSchema },
  onSubmit: async ({ value }) => {
    const payload: CreateDoctorCommand = {
      firstName: value.firstName,
      // ...
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

    await mutateAsync({ data: payload });
    await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
  },
});
```
This is the main “bridge” from UI state to API contract. It shows frontend validation, payload shaping, and cache invalidation after mutation.

From `frontend/src/api/generated/doctors/doctors.ts`:
```ts
export const getCreateDoctorUrl = () => `/api/v1/doctors`;

export const createDoctor = async (createDoctorCommand: CreateDoctorCommand, options?: RequestInit) => {
  return ofetchMutator(getCreateDoctorUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(createDoctorCommand)
  });
};
```
This generated function is the actual HTTP caller used by `useCreateDoctor`.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorEndpoint.cs`:
```csharp
group
    .MapPost(ApiEndpoints.Doctors.CreateDoctor, async (CreateDoctorCommand cmd, CreateDoctorHandler handler, CancellationToken ct) =>
    {
        var doctorPublicId = await handler.HandleAsync(cmd, ct);
        return TypedResults.Created($"/api/v1/doctors/{doctorPublicId}");
    })
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<CreateDoctorCommand>>();
```
This endpoint enforces admin-only access and server-side validation before business logic runs.

From `backend/src/TeleHealth.Api/Features/Doctors/CreateDoctor/CreateDoctorHandler.cs`:
```csharp
var department = await db.Departments.FirstOrDefaultAsync(d => d.Name == cmd.DepartmentName, ct);
if (department is null)
{
    department = new Department { Slug = slugHelper.GenerateSlug(cmd.DepartmentName), Name = cmd.DepartmentName };
    db.Departments.Add(department);
    await db.SaveChangesAsync(ct);
}

await using var transaction = await db.Database.BeginTransactionAsync(ct);
// create User + hash password + save
// create Doctor + qualifications + save
await transaction.CommitAsync(ct);
```
This is where the database state changes happen. It auto-creates a missing department by name, then creates linked user and doctor records inside a transaction.

## End-to-End Code Flow
1. Admin clicks “Add New Doctor” and opens dialog.
2. Frontend fetches departments for the select field.
3. Admin enters data; Zod checks required fields and password rules.
4. Frontend builds `CreateDoctorCommand` payload.
5. Generated mutation posts to `/api/v1/doctors`.
6. Endpoint enforces `AdminPolicy` and validation filter.
7. Handler writes data (department/user/doctor), handling unique constraint conflicts as domain exceptions.
8. Endpoint returns `201 Created`.
9. Frontend shows success toast, invalidates doctor list query, closes modal; or shows error toast from ProblemDetails.

## Important Details
- There is **dual validation**: Zod on frontend for UX + FluentValidation on backend for authoritative enforcement.
- Frontend defaults gender to `"N"` when blank, matching backend validator allowed set (`M/F/O/N`).
- Query invalidation uses generated key helper `getGetAllQueryKey()` so doctor list screens refetch fresh data.
- Backend command marks `Password` and `IcNumber` with `[NotLogged]`, reducing accidental sensitive data exposure in structured logging.
- Backend uniqueness conflicts (username/email/IC) are mapped from Postgres constraint names into typed domain exceptions.

## Beginner Programmer Notes
- **Mutation**: TanStack Query term for write operations (POST/PUT/DELETE).
- **Generated hook**: Type-safe function generated from OpenAPI; avoids manual fetch boilerplate.
- **Validation filter**: Backend middleware-like check that validates request DTO before handler execution.
- **Handler**: Vertical-slice class containing feature business logic and database writes.
- **Query invalidation**: Marks cached doctor list as stale so it refreshes with newly created doctor data.
