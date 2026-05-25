# Add New Doctor Form (Plain-English Explanation)

## Short Version
`AddNewDoctorForm.tsx` is the admin popup form used to register a new doctor in the system. It collects personal, professional, address, and qualification details, validates the required fields, then sends the data to the backend create-doctor API. If the request succeeds, it shows a success message, refreshes the doctor list, and closes the popup. If it fails, it shows an error message. 

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx` | Main UI and logic for collecting doctor details, validating them, and submitting to the API. |

## What Happens
1. The component opens as a modal dialog when `open` is true.
2. It preloads department options (only when the dialog is open) so the admin can assign the doctor to a department.
3. The form is split into four tabs: **Personal**, **Professional**, **Address**, and **Qualifications**.
4. Before submit, the form runs Zod validation (required fields, email format, password strength, qualification year range, etc.).
5. On submit, the form maps UI values into a `CreateDoctorCommand` payload.
6. It calls the generated `useCreateDoctor` mutation.
7. On success, it:
   - shows a success toast,
   - invalidates the doctor list query cache so the list refreshes,
   - closes the modal.
8. On failure, it shows a backend error title (if available) or a fallback message.

## Important Code Snippets

From `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx`:

```tsx
const form = useForm({
  defaultValues: addDoctorDefaultValues,
  validators: { onSubmit: addDoctorSchema },
  onSubmit: async ({ value }) => {
    const payload: CreateDoctorCommand = {
      firstName: value.firstName,
      lastName: value.lastName,
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
```

This is the heart of the form logic: validate input, then build the backend request body. Address is optional (sent as `null` when street is empty), while qualifications are sent as a list.

From `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx`:

```tsx
try {
  await mutateAsync({ data: payload });
  toast.success(`Dr. ${value.firstName} ${value.lastName} has been added.`);
  await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
  onOpenChange(false);
} catch (error) {
  if (error instanceof ApiError) {
    toast.error(error.data?.title ?? "Failed to add doctor.");
  } else {
    toast.error("Failed to add doctor.");
  }
}
```

This controls user feedback and data refresh after submission.

From `frontend/src/features/admins/manageDoctors/AddNewDoctorForm.tsx`:

```tsx
const {
  data: departmentsData,
  isError: isDepartmentsError,
  isLoading: isDepartmentsLoading,
} = useAdminGetAllDepartments(
  { Page: 1, PageSize: 100 },
  {
    query: {
      enabled: open,
    },
  },
);
```

Departments are fetched only while the modal is open. This avoids unnecessary background requests when the form is not visible.

## Code Flow
1. Admin opens **Add New Doctor** dialog.
2. Component fetches departments for the dropdown.
3. Admin fills form across tabs.
4. Zod validation checks required fields and value rules.
5. Submit button triggers `form.handleSubmit()`.
6. Component creates `CreateDoctorCommand` payload and calls `useCreateDoctor`.
7. Backend response returns:
   - Success → toast + refresh doctor list + close dialog.
   - Error → error toast, dialog stays open for fixes.

## Important Details
- Password visibility toggle uses an eye icon button to switch between hidden and plain text.
- Qualification rows are dynamic (add/remove) and each row has degree, institution, and year.
- Submit button disables automatically when form is invalid or request is in progress.
- Department dropdown handles three states clearly: loading, failure, or no departments available.

## In Everyday Words
This file is the “new doctor signup form” for admins. It makes sure key details are filled correctly, sends them to the server, and then updates the doctor list so the new doctor appears immediately.
