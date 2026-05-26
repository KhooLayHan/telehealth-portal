# EditLabTechForm.tsx Explanation

## Short Version
`EditLabTechForm.tsx` renders the admin modal used to edit an existing lab technician, validate the input on the client, and submit updates to the backend using an Orval-generated TanStack Query mutation. The form is split into Personal, Account, and Address tabs and is pre-filled from the selected `AdminLabTechDto` row. On success it shows a toast, invalidates the lab tech list query, and closes the dialog so the table refreshes with updated data.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx` | Main component being explained: schema, form state, submit payload, UI behavior. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API functions/hooks used by this component (`useAdminUpdateLabTech`, list query key invalidation, endpoint URLs/methods). |

## Technical Flow
1. A parent admin screen passes `labTech`, `open`, and `onOpenChange` into `EditLabTechForm`.
2. If no row is selected (`labTech === null`), the component returns `null` and nothing is rendered.
3. When a row is selected, `EditLabTechFormContent` mounts with form defaults from `buildEditDefaultValues(labTech)`.
4. `useForm` from TanStack Form runs Zod validation (`editLabTechSchema`) when the user submits.
5. On valid submit, it calls `useAdminUpdateLabTech().mutateAsync` with:
   - `id: labTech.publicId` (URL segment), and
   - `data: AdminUpdateLabTechCommand` body.
6. The generated API client sends a `PUT` request to `/api/v1/admins/lab-techs/{id}`.
7. On success, the component:
   - shows `toast.success`,
   - invalidates `getAdminGetAllLabTechsQueryKey()`, and
   - closes the dialog.
8. On error, if it is `ApiError`, it shows backend Problem Details title; otherwise a generic fallback toast.

## Frontend Code
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
This is the client-side safety net. It prevents obvious invalid inputs before the request is sent. For beginners: Zod is a runtime validator; it checks actual user input, not just TypeScript types.

From `frontend/src/features/admins/manageLabTech/EditLabTechForm.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminUpdateLabTech({
  mutation: {
    onSuccess: async () => {
      toast.success("Lab technician updated successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
      onOpenChange(false);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.data.title ?? "Failed to update lab technician");
        return;
      }

      toast.error("Failed to update lab technician");
    },
  },
});
```
This wires the generated API mutation to UI side effects. Query invalidation tells TanStack Query to refetch the lab-tech list so stale table data is replaced.

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
This is the payload mapping step. Important detail: address is conditionally sent as `null` if street is empty, which changes backend behavior versus sending an empty object.

## Backend Code
No backend feature files were directly required to explain this component request, but the generated client confirms the backend contract used:

From `frontend/src/api/generated/admins/admins.ts`:

```ts
export const getAdminUpdateLabTechUrl = (id: string,) => {
  return `/api/v1/admins/lab-techs/${id}`
}

export const adminUpdateLabTech = async (id: string,
    adminUpdateLabTechCommand: AdminUpdateLabTechCommand, options?: RequestInit) => {
  return ofetchMutator(getAdminUpdateLabTechUrl(id), {
    ...options,
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    body: JSON.stringify(adminUpdateLabTechCommand)
  });
}
```
This proves the component is updating an existing lab tech through `PUT /api/v1/admins/lab-techs/{id}` using a JSON request body.

## End-to-End Code Flow
1. Admin clicks edit on a lab tech row.
2. Parent passes selected `AdminLabTechDto` into `EditLabTechForm`.
3. Form fields are initialized via `buildEditDefaultValues`.
4. Admin edits fields across tabs and clicks **Save Changes**.
5. Zod validation runs in `useForm` `onSubmit` pipeline.
6. If valid, `mutateAsync` executes `useAdminUpdateLabTech`.
7. Generated client sends `PUT /api/v1/admins/lab-techs/{publicId}` with `AdminUpdateLabTechCommand`.
8. On success, list query key is invalidated and dialog closes.
9. On failure, toast shows backend/problem error title (when available) or a generic message.

## Important Details
- The dialog form resets back to the selected lab tech’s original values whenever the dialog closes (`handleOpenChange` + `form.reset`).
- `key={labTech.publicId}` forces remounting when switching to another lab tech, preventing stale form state from bleeding between records.
- `form.Subscribe` disables submit when form cannot submit or when submit/mutation is pending, avoiding duplicate requests.
- `toFieldErrors` adapts TanStack Form error structures into the `FieldError` UI contract.

## Beginner Programmer Notes
- **TanStack Form** manages input state and submit lifecycle.
- **Zod schema** is runtime validation for user-entered values.
- **Orval-generated hooks** (`useAdminUpdateLabTech`) are typed wrappers around API endpoints.
- **TanStack Query invalidation** means “mark this cached list stale and fetch fresh data.”
- **DTO** (`AdminLabTechDto`) means Data Transfer Object: a typed shape sent/received over HTTP.
