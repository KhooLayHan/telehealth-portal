# Edit Department Form (Admin) — Plain English Explanation

## Short Version
This component shows a popup form that lets an admin edit a department’s name and description. It pre-fills the form with the selected department, validates the input, and sends an update request to the backend. If the update succeeds, it refreshes the departments list and closes the popup. If it fails, it shows an error message.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx` | Main component that renders the edit dialog, validates input, submits updates, and handles success/error UI states. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Defines `DepartmentTableRow`, the data shape passed into the edit form, including where `id` comes from (`slug`). |

## What Happens
1. The page passes a selected department row into `EditDepartmentForm`.
2. If no department is selected, nothing is rendered.
3. If a department is selected, the dialog content mounts with that department’s values.
4. The form is pre-filled with the current department name and description.
5. On submit, client-side validation runs:
   - name is required, max 100 characters
   - description is optional, max 500 characters
6. If valid, it sends an API request to update the department by slug.
7. On success, a success toast appears, the department list query is invalidated (so fresh data is fetched), and the dialog closes.
8. On failure, an error toast appears.
9. If the dialog is closed (Cancel or outside click), form values reset back to the department’s original values.

## Important Code Snippets
From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const editDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(MAX_DEPARTMENT_NAME_LENGTH, "Department name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(MAX_DEPARTMENT_DESCRIPTION_LENGTH, "Description must be 500 characters or fewer"),
});
```
This is the validation contract for the form. It prevents blank names and overly long text before any API call is made.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
if (!department) {
  return null;
}
```
The edit dialog only exists when a row is selected. This avoids showing an empty or invalid edit form.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const form = useForm({
  defaultValues: buildEditDepartmentValues(department),
  validators: { onSubmit: editDepartmentSchema },
  onSubmit: async ({ value }) => {
    const description = value.description.trim();

    await mutateAsync({
      slug: department.id,
      data: {
        name: value.name.trim(),
        description: description.length > 0 ? description : null,
      },
    });
  },
});
```
This wires form state, validation, and submit behavior together. The key part is that it sends `slug: department.id` and converts an empty description to `null`.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
onSuccess: async () => {
  toast.success("Department details updated successfully");
  await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
  onOpenChange(false);
},
onError: (error) => {
  if (error instanceof ApiError) {
    toast.error(error.data.title ?? "Failed to update department");
    return;
  }

  toast.error("Failed to update department");
},
```
This controls user feedback. Success refreshes the list and closes the modal; failure shows a clear error toast.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:

```tsx
const handleOpenChange = (nextOpen: boolean) => {
  if (!nextOpen) {
    form.reset(buildEditDepartmentValues(department));
  }

  onOpenChange(nextOpen);
};
```
When the dialog closes, unsaved edits are discarded and original values are restored.

From `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx`:

```tsx
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "",
    staffMembers: Number(department.staffMembers ?? 0),
    createdAt: department.createdAt,
  };
}
```
This shows that `department.id` used by the form is actually the department slug from the API response.

## Code Flow
1. Admin clicks edit on a department row.
2. `EditDepartmentForm` receives the selected row and `open=true`.
3. `EditDepartmentFormContent` renders the dialog and pre-fills values.
4. Admin changes fields and clicks **Save Changes**.
5. TanStack Form validates using the Zod schema.
6. `useAdminUpdateDepartment` sends the update request.
7. On success, toast + query invalidation + close dialog.
8. Refetched departments data updates the table UI.

## Important Details
- The component uses both `isSubmitting` (form state) and `isPending` (mutation state) to disable submit and avoid duplicate saves.
- Description is optional in UX, and empty text is intentionally sent as `null` so the backend can treat it as no description.
- Field-level errors are converted into the format expected by the `FieldError` UI component via `toFieldErrors`.
- The `key={department.id}` on `EditDepartmentFormContent` helps ensure a clean remount when editing a different row.

## In Everyday Words
This popup is a safe edit screen for department details: it fills in the current values, checks the input before sending, saves changes to the server, refreshes the list so admins immediately see updates, and throws away unsaved typing when closed.
