# Edit Receptionist Form (Admin)

## Short Version
This component shows a popup form that lets an admin update an existing receptionist’s profile, account details, and address. It loads the selected receptionist’s current data into the form, validates required fields, and sends the update request to the backend when Save is clicked. If the update succeeds, the UI refreshes the receptionist list and closes the popup. If the API returns an error, a toast message is shown.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx` | Main component that renders the edit dialog, validates form data, and sends the update mutation. |
| `frontend/src/features/admins/AdminReceptionistsPage.tsx` | Parent page that controls when this edit form opens and which receptionist is passed in. |

## What Happens
1. The parent admin page picks a receptionist and opens this dialog.
2. `EditReceptionistForm` receives that receptionist object and pre-fills form fields with current values.
3. The form is split into 3 tabs: **Personal**, **Account**, and **Address**.
4. Before submit, the schema checks required fields (for example first name, last name, username, email format, and 12-digit IC number).
5. On submit, the component calls the generated API mutation (`useAdminUpdateReceptionist`) with the receptionist `publicId` and updated field values.
6. On success, it shows a success toast, invalidates the receptionist list query so data refreshes, and closes the dialog.
7. On API error, it shows a failure toast using the API error title when available.

## Important Code Snippets

From `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx`:
```tsx
const editReceptionistSchema = z.object({
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
This is the main input validation layer on the frontend. It prevents empty required fields and blocks invalid email/IC format before the API call.

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
This block handles the backend update lifecycle: success feedback + list refresh + close dialog, and error feedback on failures.

From `frontend/src/features/admins/manageReceptionists/EditReceptionistForm.tsx`:
```tsx
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
```
This is the outbound payload mapping. One important behavior: if `street` is empty, the whole address object is sent as `null`.

From `frontend/src/features/admins/AdminReceptionistsPage.tsx`:
```tsx
<EditReceptionistForm
  key={editReceptionist?.publicId}
  receptionist={editReceptionist}
  open={editDialogOpen}
  onOpenChange={setEditDialogOpen}
/>
```
This is where the parent page mounts the dialog and passes both the selected receptionist and open/close state.

## Code Flow
1. Admin clicks edit action on a receptionist row.
2. `AdminReceptionistsPage` sets selected receptionist and opens the edit dialog.
3. `EditReceptionistForm` initializes default values from that selected receptionist.
4. Admin edits fields in Personal/Account/Address tabs.
5. Form validation runs on submit via Zod + TanStack Form validators.
6. `useAdminUpdateReceptionist` sends update request using receptionist `publicId`.
7. Success path: toast + list query invalidation + dialog closes.
8. Error path: error toast message appears and dialog remains open.

## Important Details
- The component returns `null` when no receptionist is provided, so the dialog cannot render without a selected record.
- The Save button is disabled when form cannot submit, when form is submitting, or when mutation is pending.
- The `key={editReceptionist?.publicId}` in the parent helps force a clean form instance when a different receptionist is selected.
- Gender defaults to `"N"` (Not specified) when missing.

## In Everyday Words
This is the “edit receptionist profile” popup for admins. It fills in the current info, checks that required values are valid, then saves changes to the server. If the save works, the page refreshes the list and closes the popup; if not, it shows an error message.
