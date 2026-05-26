# AddNewReceptionistForm.tsx Code Flow Explanation

## Short Version
`AddNewReceptionistForm` is a modal form component that lets an admin register a new receptionist from the frontend. It validates user input with a Zod schema, submits the payload through the generated `useAdminCreateReceptionist` mutation hook, and then refreshes the receptionist list query on success. On the backend, the request is handled by a protected admin endpoint, validated again with FluentValidation, and persisted as a `User` with the `receptionist` role.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx` | Main UI/form logic, validation schema, submit behavior, and mutation handling. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API client and TanStack Query mutation function used by the form. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistEndpoint.cs` | Maps the backend POST route and enforces admin authorization + validation filter. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistCommand.cs` | Defines request payload contract expected by backend. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistValidator.cs` | Backend safety-net validation rules for all submitted fields. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistHandler.cs` | Creates the receptionist record, hashes password, enforces uniqueness, and returns DTO. |

## Technical Flow
1. Admin opens a dialog controlled by the `open` and `onOpenChange` props in `AddNewReceptionistForm`.
2. TanStack Form initializes with `addReceptionistDefaultValues` and uses `addReceptionistSchema` as submit-time validator.
3. Admin fills data across three tabs (`personal`, `account`, `address`).
4. On submit, frontend transforms form state into `AdminCreateReceptionistCommand` shape and calls `mutate({ data: ... })` from `useAdminCreateReceptionist`.
5. Generated client sends `POST /api/v1/admins/receptionists` with JSON body.
6. Backend endpoint requires `AuthConstants.AdminPolicy` and runs `ValidationFilter<AdminCreateReceptionistCommand>`.
7. Handler resolves `receptionist` role, hashes password, writes new `User`, catches unique-constraint conflicts, and returns `AdminReceptionistDto` with `201 Created`.
8. Frontend shows success toast, invalidates receptionist list cache (`getAdminGetAllReceptionistsQueryKey()`), and closes dialog.

## Frontend Code
From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

```tsx
const addReceptionistSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    ...
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    ...
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```
This is the frontend validation rule set. It ensures required fields and basic formatting (like email/password length), plus cross-field password confirmation before submit.

From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

```tsx
const { mutate, isPending } = useAdminCreateReceptionist({
  mutation: {
    onSuccess: () => {
      toast.success("Receptionist created successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to create receptionist");
      }
    },
  },
});
```
This connects the form to the generated API mutation. On success it refreshes list data and closes modal; on error it surfaces backend ProblemDetails title.

From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

```tsx
onSubmit: async ({ value }) => {
  mutate({
    data: {
      firstName: value.firstName,
      ...
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
},
```
This maps UI values into backend command payload shape. Address is optional: if `street` is empty, frontend sends `address: null`.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const adminCreateReceptionist = async (
  adminCreateReceptionistCommand: AdminCreateReceptionistCommand,
  options?: RequestInit,
): Promise<adminCreateReceptionistResponse> => {
  return ofetchMutator<adminCreateReceptionistResponse>(getAdminCreateReceptionistUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(adminCreateReceptionistCommand),
  });
};
```
This is the generated HTTP wrapper that performs the actual POST request.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistEndpoint.cs`:

```csharp
group
    .MapPost(ApiEndpoints.Admins.CreateReceptionist, async Task<Created<AdminReceptionistDto>> (...))
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<AdminCreateReceptionistCommand>>();
```
The route is protected for admins only and validates incoming command before handler execution.

From `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistCommand.cs`:

```csharp
public sealed record AdminCreateReceptionistCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    [property: NotLogged] string Password,
    string? PhoneNumber,
    char Gender,
    LocalDate DateOfBirth,
    string IcNumber,
    Address? Address
);
```
This is the backend request contract. `Password` is marked `[NotLogged]`, reducing accidental sensitive logging exposure.

From `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistValidator.cs`:

```csharp
RuleFor(x => x.Password)
    .NotEmpty()
    .MinimumLength(8)
    .Matches("[A-Z]")
    .Matches("[a-z]")
    .Matches("[0-9]")
    .Matches("[^a-zA-Z0-9]");
RuleFor(x => x.IcNumber)
    .NotEmpty()
    .Matches(@"^\d{12}$");
```
Backend validation is stricter than frontend for password complexity and IC number format, which is important because frontend validation can be bypassed.

From `backend/src/TeleHealth.Api/Features/Admins/CreateReceptionist/AdminCreateReceptionistHandler.cs`:

```csharp
var user = new User
{
    PublicId = publicId,
    ...
    Roles = { receptionistRole },
};
user.PasswordHash = passwordHasher.HashPassword(user, cmd.Password);

db.Users.Add(user);
await db.SaveChangesAsync(ct);
```
This is where persistence happens: it creates a `User`, assigns receptionist role, hashes password, and writes to database.

```csharp
catch (DbUpdateException ex)
    when (ex.InnerException is PostgresException pg
        && pg.SqlState == PostgresErrorCodes.UniqueViolation)
{
    throw pg.ConstraintName switch
    {
        "uq_users_username_active" => new DuplicateUsernameException(),
        "uq_users_email_active" => new DuplicateEmailException(),
        "uq_users_ic_active" => new DuplicateIcNumberException(),
        _ => new UserAlreadyExistsException(),
    };
}
```
This maps database unique constraint violations to domain-specific exceptions, so API responses are meaningful and consistent.

## End-to-End Code Flow
1. Admin clicks UI action to open the “Add New Receptionist” dialog.
2. `AddNewReceptionistForm` collects personal/account/address data using TanStack Form fields.
3. Zod validates the form and enforces `password === confirmPassword` on submit.
4. Frontend mutation calls generated `adminCreateReceptionist` function.
5. Request reaches `POST /api/v1/admins/receptionists` endpoint.
6. Endpoint checks `AdminPolicy` authorization and runs backend FluentValidation rules.
7. Handler creates user with receptionist role, hashes password, saves to DB, and returns created receptionist DTO.
8. Frontend receives success, shows toast, invalidates receptionist list query cache, and closes modal.

## Important Details
- Validation happens in both layers; backend is the source of truth.
- The frontend defaults `gender` to `"N"` (“Prefer not to say”).
- Address is optional in request payload.
- API errors are surfaced with `ApiError` and `ProblemDetails` title.
- Cache invalidation uses `getAdminGetAllReceptionistsQueryKey()`, ensuring list UI refreshes after creation.
- Endpoint is admin-only (`AuthConstants.AdminPolicy`), preventing non-admin access.

## Beginner Programmer Notes
- **TanStack Form**: handles form state and submit lifecycle with field-level state.
- **Mutation (TanStack Query)**: write operation (POST/PUT/DELETE) with success/error callbacks.
- **Generated hook (`useAdminCreateReceptionist`)**: typed wrapper created from backend OpenAPI spec.
- **DTO**: a structured data object returned to frontend (`AdminReceptionistDto`).
- **ValidationFilter + FluentValidation**: backend request guardrails independent of frontend.
- **ProblemDetails**: standard API error format for consistent client-side error handling.
