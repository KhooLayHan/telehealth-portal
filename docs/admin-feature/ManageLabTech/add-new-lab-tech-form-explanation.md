# AddNewLabTechForm.tsx Code Flow Explanation

## Short Version
`AddNewLabTechForm` is a modal form component that lets an admin create a new lab technician account by filling personal, account, and address fields, then submitting them through a generated API mutation hook. It performs frontend validation with Zod and TanStack Form, calls `useAdminCreateLabTech`, and on success it refreshes the lab tech list query cache and closes/reset the dialog. On the backend, the request is validated again using FluentValidation, protected by `AdminPolicy`, and persisted by a handler that creates a `User` with the `lab-tech` role.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx` | Main UI component, form schema, submit handler, success/error behavior. |
| `frontend/src/api/generated/admins/admins.ts` | Generated `useAdminCreateLabTech` mutation and `/api/v1/admins/lab-techs` request details. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechEndpoint.cs` | Maps POST endpoint and enforces admin authorization plus validation filter. |
| `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechCommand.cs` | Request contract expected by backend (`LocalDate`, `Address`, etc.). |
| `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechValidator.cs` | Server-side validation rules (password complexity, IC format, DOB, etc.). |
| `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechHandler.cs` | Business logic: role lookup, password hashing, DB write, unique-constraint handling. |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Confirms route constant for `admins/lab-techs`. |
| `backend/src/TeleHealth.Api/Common/Security/AuthConstants.cs` | Confirms `AdminPolicy` constant used by endpoint authorization. |

## Technical Flow
1. Admin opens dialog from the lab tech management page; `AddNewLabTechForm` receives `open` and `onOpenChange` props.
2. `useForm` initializes with `addLabTechDefaultValues` and uses `addLabTechSchema` for submit-time validation.
3. User fills three tab sections:
   - **Personal**: name, IC, phone, gender, DOB
   - **Account**: username, email, password/confirm password
   - **Address**: optional address fields
4. On submit, TanStack Form validates using Zod. If valid, `mutate({ data: ... })` sends payload to generated mutation hook.
5. Generated hook sends `POST /api/v1/admins/lab-techs` with JSON body.
6. Backend endpoint requires `AdminPolicy`, runs `ValidationFilter<AdminCreateLabTechCommand>`, and calls handler.
7. Handler verifies `lab-tech` role exists, creates `User`, hashes password, saves transactionally, maps unique-constraint conflicts to domain exceptions, then returns `AdminLabTechDto`.
8. Frontend `onSuccess` shows toast, invalidates `getAdminGetAllLabTechsQueryKey()` so list refetches, resets form, and closes modal.
9. Frontend `onError` shows API problem title (if available) or fallback error toast.

## Frontend Code
From `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx`:
```tsx
const addLabTechSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    // ...
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```
This is the **frontend validation safety net**. It checks required fields, basic formats, and cross-field password confirmation before sending data.

From `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx`:
```tsx
const { mutate, isPending } = useAdminCreateLabTech({
  mutation: {
    onSuccess: () => {
      toast.success("Lab technician created successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to create lab technician");
        return;
      }
      toast.error("Failed to create lab technician");
    },
  },
});
```
This wires the mutation to UX behavior. Cache invalidation is important because it triggers fresh lab-tech list data after successful creation.

From `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx`:
```tsx
onSubmit: async ({ value }) => {
  mutate({
    data: {
      firstName: value.firstName,
      // ...
      dateOfBirth: value.dateOfBirth,
      icNumber: value.icNumber,
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
This transforms form state into the backend command shape. Address is optional and only sent when `street` is provided.

From `frontend/src/api/generated/admins/admins.ts`:
```ts
export const getAdminCreateLabTechUrl = () => {
  return `/api/v1/admins/lab-techs`
}

export const adminCreateLabTech = async (adminCreateLabTechCommand: AdminCreateLabTechCommand, options?: RequestInit): Promise<adminCreateLabTechResponse> => {
  return ofetchMutator<adminCreateLabTechResponse>(getAdminCreateLabTechUrl(), {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(adminCreateLabTechCommand)
  });
}
```
This is the generated network layer that the form uses indirectly through `useAdminCreateLabTech`.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechEndpoint.cs`:
```csharp
group
    .MapPost(ApiEndpoints.Admins.CreateLabTech, async Task<Created<AdminLabTechDto>> (
        AdminCreateLabTechCommand cmd,
        AdminCreateLabTechHandler handler,
        CancellationToken ct) =>
    {
        var result = await handler.HandleAsync(cmd, ct);
        return TypedResults.Created($"/api/v1/admins/lab-techs/{result.PublicId}", result);
    })
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<AdminCreateLabTechCommand>>();
```
This maps the POST route, requires admin auth, and applies backend validation filter.

From `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechValidator.cs`:
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
These are stricter backend rules than the frontend, which is expected: server validation is the final authority.

From `backend/src/TeleHealth.Api/Features/Admins/CreateLabTech/AdminCreateLabTechHandler.cs`:
```csharp
var user = new User
{
    PublicId = publicId,
    Slug = slugHelper.GenerateSlug($"user-{publicId:N}"),
    Username = cmd.Username,
    Email = cmd.Email,
    PasswordHash = string.Empty,
    FirstName = cmd.FirstName,
    LastName = cmd.LastName,
    IcNumber = cmd.IcNumber,
    Gender = cmd.Gender,
    DateOfBirth = cmd.DateOfBirth,
    Phone = cmd.PhoneNumber,
    Address = cmd.Address,
    Roles = { labTechRole },
};
user.PasswordHash = passwordHasher.HashPassword(user, cmd.Password);
```
This is where the new lab tech user entity is created and password is securely hashed.

## End-to-End Code Flow
1. Admin clicks “Add New Lab Technician” and dialog opens.
2. `AddNewLabTechForm` tracks inputs with TanStack Form state.
3. Zod `addLabTechSchema` validates fields and password confirmation on submit.
4. `useAdminCreateLabTech` sends JSON payload to `POST /api/v1/admins/lab-techs`.
5. Backend endpoint checks `AdminPolicy` and runs `ValidationFilter`.
6. `AdminCreateLabTechValidator` enforces server rules (including password complexity and exact 12-digit IC).
7. `AdminCreateLabTechHandler` writes `User` + role assignment in a transaction.
8. Backend returns `201 Created` with `AdminLabTechDto`.
9. Frontend shows success toast, invalidates list query key, resets form, and closes dialog.

## Important Details
- Frontend only checks minimum password length; backend additionally requires uppercase/lowercase/digit/special character.
- Frontend sends `dateOfBirth` string; backend binds it to NodaTime `LocalDate` in command model.
- Error handling is user-friendly: API problem title when available, fallback message otherwise.
- Query invalidation uses generated `getAdminGetAllLabTechsQueryKey()` to keep list view in sync.
- Backend catches database unique violations and maps to typed domain exceptions (duplicate username/email/IC).

## Beginner Programmer Notes
- **TanStack Form**: manages form field state and submit lifecycle.
- **Mutation hook** (`useAdminCreateLabTech`): a function wrapper around a POST API call plus loading/success/error states.
- **DTO**: a “data transfer object” returned from backend (`AdminLabTechDto`) containing fields for UI use.
- **ValidationFilter + FluentValidation**: backend-level guard so invalid payloads are rejected even if frontend checks are bypassed.
- **Query invalidation**: tells TanStack Query to refetch stale list data after successful mutations.
