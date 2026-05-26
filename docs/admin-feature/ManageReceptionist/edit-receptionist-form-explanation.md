# EditReceptionistForm.tsx — Technical Code Flow Explanation

## Short Version
`EditReceptionistForm` is an admin modal form that lets a user edit an existing receptionist record, validate fields on the client, and submit updates through an Orval-generated TanStack Query mutation hook. On success, it shows a toast, refreshes the receptionist list query cache, and closes the dialog. The backend endpoint enforces admin-only access, validates the payload again with FluentValidation, checks duplicate IC numbers, updates the `User` entity, and returns the updated receptionist DTO.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx` | Main React component and form logic the user asked about |
| `frontend/src/api/generated/admins/admins.ts` | Generated API/mutation hook (`useAdminUpdateReceptionist`) used by the form |
| `backend/src/TeleHealth.Api/Common/ApiEndpoints.cs` | Defines the backend route template used by the endpoint |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistEndpoint.cs` | Maps the PUT endpoint, auth policy, and validation filter |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistCommand.cs` | Backend request shape expected by the endpoint |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistValidator.cs` | Backend validation rules (server safety net) |
| `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistHandler.cs` | Database lookup/update logic and duplicate IC enforcement |

## Technical Flow
1. **Dialog receives selected receptionist** via props (`receptionist`, `open`, `onOpenChange`) and pre-fills form fields with `buildEditDefaultValues`.
2. **Frontend validation** uses `editReceptionistSchema` (Zod) when the form submits.
3. On submit, the component calls **generated mutation** `useAdminUpdateReceptionist` with:
   - `id` = `receptionist.publicId`
   - `data` = mapped form payload (`firstName`, `lastName`, etc.), including optional `address`.
4. The generated client sends a **PUT** request to `/api/v1/admins/receptionists/{id}`.
5. Backend endpoint (`MapAdminUpdateReceptionistEndpoint`) requires `AuthConstants.AdminPolicy` and runs `ValidationFilter<AdminUpdateReceptionistCommand>`.
6. Handler loads the receptionist user by `PublicId` + role slug `receptionist`, rejects missing users, checks duplicate IC numbers, updates fields, saves changes, and returns `AdminReceptionistDto`.
7. Frontend `onSuccess` shows toast, invalidates `getAdminGetAllReceptionistsQueryKey()`, then closes modal; `onError` handles `ApiError` and shows backend ProblemDetails title.

## Frontend Code
From `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx`:

```tsx
const { mutate, isPending } = useAdminUpdateReceptionist({
  mutation: {
    onSuccess: () => {
      toast.success("Receptionist updated successfully");
      queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to update receptionist");
      }
    },
  },
});
```

This block wires the mutation lifecycle to UI behavior: success updates user feedback + refreshes cached list data; error reads ProblemDetails from the API error wrapper.

From `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx`:

```tsx
onSubmit: async ({ value }) => {
  if (!receptionist?.publicId) return;

  mutate({
    id: receptionist.publicId,
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
},
```

This is the payload bridge from form state to backend command body. The `address` object is only sent when `street` exists; otherwise it sends `null`.

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminUpdateReceptionistUrl = (id: string,) => {
  return `/api/v1/admins/receptionists/${id}`
}

export const adminUpdateReceptionist = async (
  id: string,
  adminUpdateReceptionistCommand: AdminUpdateReceptionistCommand,
  options?: RequestInit
): Promise<adminUpdateReceptionistResponse> => {
  return ofetchMutator<adminUpdateReceptionistResponse>(getAdminUpdateReceptionistUrl(id), {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(adminUpdateReceptionistCommand)
  });
}
```

This generated layer is the HTTP transport wrapper. `useAdminUpdateReceptionist` in the component is built on top of this function.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistEndpoint.cs`:

```csharp
group
    .MapPut(ApiEndpoints.Admins.UpdateReceptionist, ...)
    .RequireAuthorization(AuthConstants.AdminPolicy)
    .AddEndpointFilter<ValidationFilter<AdminUpdateReceptionistCommand>>();
```

This endpoint mapping does two important safety checks before the handler:
- only admins can call it,
- the command is validated by FluentValidation via the shared validation filter.

From `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistValidator.cs`:

```csharp
RuleFor(x => x.IcNumber)
    .NotEmpty()
    .Matches(@"^\d{12}$")
    .WithMessage("Malaysian IC Number must be exactly 12 digits without dashes.");

RuleFor(x => x.Gender)
    .Must(g => Array.IndexOf(ValidGenders, g) >= 0)
    .WithMessage("Gender must be M, F, O, or N.");
```

Even though the frontend validates too, this server validation is the trusted source (frontend can be bypassed).

From `backend/src/TeleHealth.Api/Features/Admins/UpdateReceptionist/AdminUpdateReceptionistHandler.cs`:

```csharp
var user = await db
    .Users.Include(u => u.Roles)
    .FirstOrDefaultAsync(
        u =>
            u.PublicId == receptionistPublicId
            && u.Roles.Any(r => r.Slug == ReceptionistSlug),
        ct
    );

if (user is null)
{
    throw new UserNotFoundException(receptionistPublicId);
}
```

This ensures the update target is a real **receptionist** account, not just any user with a matching GUID.

```csharp
var hasDuplicateIcNumber =
    !string.Equals(user.IcNumber, cmd.IcNumber, StringComparison.Ordinal)
    && await db.Users.AnyAsync(
        u =>
            u.IcNumber == cmd.IcNumber
            && u.PublicId != user.PublicId
            && u.DeletedAt == null,
        ct
    );

if (hasDuplicateIcNumber)
{
    throw new DuplicateIcNumberException();
}
```

This duplicate check only runs when IC number actually changed, and ignores soft-deleted users (`DeletedAt == null`).

## End-to-End Code Flow
1. Admin opens edit modal for a selected receptionist.
2. `EditReceptionistForm` initializes fields from `AdminReceptionistDto` values.
3. User edits values in Personal/Account/Address tabs.
4. Form submit triggers Zod client validation and then mutation call.
5. Generated API function sends PUT `/api/v1/admins/receptionists/{publicId}`.
6. Backend endpoint enforces admin policy + validates command.
7. Handler loads receptionist, checks duplicate IC, updates user fields, and saves.
8. Backend returns updated `AdminReceptionistDto`.
9. Frontend shows success toast, invalidates receptionist list query key, closes dialog.

## Important Details
- The component uses `publicId` for external API updates (not internal DB numeric IDs).
- The submit button is disabled when form cannot submit or mutation is pending.
- Error handling intentionally surfaces backend ProblemDetails title through `ApiError`.
- Backend marks `IcNumber` as `[NotLogged]` on the command record to reduce risk of sensitive-data logging.
- Authorization is strict (`AdminPolicy`), so non-admin users should get 403/401.

## Beginner Programmer Notes
- **Mutation**: a TanStack Query term for API calls that change data (`PUT`, `POST`, `DELETE`).
- **Query invalidation**: tells TanStack Query to refetch stale list data after successful edit.
- **DTO (Data Transfer Object)**: a response model for API payloads (`AdminReceptionistDto`).
- **Validation filter**: middleware-like endpoint filter that runs FluentValidation before handler logic.
- **Generated API hook (Orval)**: code-generated wrapper so UI code does not manually build fetch calls each time.
