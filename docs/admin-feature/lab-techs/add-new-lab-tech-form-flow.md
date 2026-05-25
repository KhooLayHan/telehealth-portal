# Add New Lab Technician Form (Plain-English Explanation)

## Short Version
This component shows a pop-up form that lets an admin register a new lab technician account. It validates required fields (including matching passwords) before sending data to the backend. If creation succeeds, it shows a success message, refreshes the lab technician list, resets the form, and closes the dialog. If it fails, it shows an error message.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx` | Main form component, validation rules, submit flow, and UI behavior. |
| `frontend/src/features/admins/AdminLabTechsPage.tsx` | Shows where this dialog is mounted and how open/close state is controlled. |

## What Happens
1. The parent page (`AdminLabTechsPage`) controls whether this form dialog is open.
2. The form starts with empty/default values.
3. As the admin types, TanStack Form tracks values and field-level validation state.
4. On submit, Zod validation runs first (required fields, valid email, password length, and password confirmation match).
5. If valid, the component calls the generated API mutation `useAdminCreateLabTech`.
6. The request payload maps form fields to the backend shape, including optional address.
7. On success: toast success message, invalidate cached lab tech list query, reset form, close modal.
8. On error: show API-provided error title when available, otherwise generic error toast.

## Important Code Snippets
From `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx`:

```tsx
const addLabTechSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Must be a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    // ...
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```
This is the main safety gate. It blocks submission until required fields are present and both password fields match.

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
This defines the backend call behavior and user feedback path for both success and failure.

From `frontend/src/features/admins/manageLabTech/AddNewLabTechForm.tsx`:

```tsx
onSubmit: async ({ value }) => {
  mutate({
    data: {
      firstName: value.firstName,
      lastName: value.lastName,
      username: value.username,
      email: value.email,
      password: value.password,
      phoneNumber: value.phoneNumber || null,
      gender: value.gender,
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
This is the data mapping step from UI form fields into the API request object.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
<AddNewLabTechForm open={addDialogOpen} onOpenChange={setAddDialogOpen} />
```
This is where the page wires the dialog open/close state into the form component.

## Code Flow
1. Admin clicks action to add a new lab technician on the page.
2. Parent component opens `AddNewLabTechForm` dialog.
3. Admin fills tabs: Personal, Account, and Address.
4. Form submit triggers Zod + TanStack validation.
5. If valid, generated admin API mutation sends create request.
6. Backend response returns success or error.
7. UI shows toast, updates cache, resets/closes form on success.

## Important Details
- Password visibility toggle is local UI state (`showPassword`) and affects both password fields.
- `form.Subscribe` disables submit button when the form is invalid or request is pending.
- `handleOpenChange(false)` always resets the form before closing, so reopened form starts clean.
- Gender uses enum values (`M`, `F`, `O`, `N`) and defaults to `N` (“Prefer not to say”).
- Address is optional as a full block: if `street` is empty, `address` is sent as `null`.

## In Everyday Words
This is a guided “create staff account” popup. It checks that the entered details make sense, sends them to the server, and gives immediate feedback. On success it also refreshes the list so the newly created lab technician appears right away.
