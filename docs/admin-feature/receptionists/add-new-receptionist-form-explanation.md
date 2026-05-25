# Add New Receptionist Form (Plain English Walkthrough)

## Short Version
This component shows a popup form that lets an admin register a new receptionist account. It validates required fields (like name, IC number, email, password, and date of birth) before sending data to the backend API. If creation succeeds, it shows a success message, refreshes the receptionist list, and closes the popup. If it fails, it shows an error message from the API when available.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx` | Main form component, validation rules, submit flow, success/error handling, and UI behavior |

## What Happens
1. The parent page controls whether this modal is open through `open` and `onOpenChange` props.
2. The form starts with clean default values for every field.
3. A Zod schema validates key inputs:
   - First/last name, username, IC number, gender, date of birth are required.
   - Email must be in valid email format.
   - Password must be at least 8 characters.
   - Confirm password must match password.
4. The UI is split into 3 tabs so data entry is easier:
   - **Personal** (name, IC, phone, gender, date of birth)
   - **Account** (username, email, password)
   - **Address** (street, city, state, postal code, country)
5. When submitted, it calls the generated API mutation hook (`useAdminCreateReceptionist`).
6. The payload maps form values to backend fields. Address is only included if `street` has a value; otherwise address is `null`.
7. On success:
   - Shows a success toast.
   - Invalidates receptionist list query cache so list reloads with latest data.
   - Closes the dialog.
8. On API error:
   - If it is an `ApiError`, shows server-provided title or fallback error text.
9. If the dialog is closed (cancel or external close), the form resets so old values are not kept next time.

## Important Code Snippets
From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

```tsx
const addReceptionistSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    email: z.string().email("Must be a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
```
This is the main frontend guardrail. It blocks invalid submissions and gives clear field-level messages.

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
This is the API request lifecycle: success feedback + list refresh + close, and error feedback for failures.

From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

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
This maps form data to the backend payload. The key behavior is conditional address sending.

From `frontend/src/features/admins/manageReceptionists/AddNewReceptionistForm.tsx`:

```tsx
const handleOpenChange = (nextOpen: boolean) => {
  if (!nextOpen) form.reset();
  onOpenChange(nextOpen);
};
```
This ensures reopening the form starts from a clean state.

## Code Flow
1. Admin opens “Add New Receptionist” dialog.
2. Component renders form tabs and controlled fields.
3. Admin enters details.
4. TanStack Form + Zod validate inputs when submitting.
5. If valid, mutation sends payload to backend create-receptionist endpoint.
6. If backend accepts, UI shows success toast, refreshes receptionist list, closes dialog.
7. If backend rejects, UI shows error toast.
8. Closing dialog resets all fields.

## Important Details
- Password visibility can be toggled for easier entry (`Eye` / `EyeOff` icon button).
- Submit button is disabled if form cannot submit, is currently submitting, or API call is pending.
- Gender has a default of `N` (“Prefer not to say”), so the field always has a valid enum value.
- Phone number is optional and normalized to `null` when empty.
- Address is optional as a whole block; no street means no address object is sent.

## In Everyday Words
This is a guided admin signup form for receptionists. It checks that critical details are filled correctly, sends the data to the server, and gives immediate success or failure feedback. It also keeps the receptionist list up to date and clears the form whenever the popup is closed.
