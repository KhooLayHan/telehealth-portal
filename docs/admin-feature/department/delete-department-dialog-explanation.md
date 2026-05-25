# Delete Department Dialog (Plain-English Explanation)

## Short Version
This component shows a confirmation popup when an admin wants to remove a department. If the admin confirms, it calls the backend delete API using the department slug, shows a success or error message, and refreshes the department list so the UI stays up to date. It also prevents accidental actions by requiring explicit confirmation.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx` | Main dialog component that performs delete and handles messages. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Shows that row `id` is actually the department `slug` used by delete API. |
| `frontend/src/features/admins/manageDepartments/DepartmentsTable.tsx` | Shows where the delete action button is triggered in each table row. |
| `frontend/src/features/admins/AdminDepartmentPage.tsx` | Shows dialog state control and how selected department is passed into dialog. |

## What Happens
1. The admin clicks the trash icon in the departments table.
2. The page stores the selected department and opens this dialog.
3. The dialog shows a warning message with the department name.
4. If the admin clicks **Remove**, the component sends a delete request to the backend.
5. On success:
   - It shows a success toast.
   - It invalidates (refreshes) the departments query cache.
   - It closes the dialog.
6. On failure:
   - If the error is an API error, it shows the backend message title when available.
   - Otherwise, it shows a generic failure message.

## Important Code Snippets
From `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx`:

```tsx
const { mutateAsync, isPending } = useAdminDeleteDepartment();
...
await mutateAsync({ slug: department.id });
toast.success("Department deleted successfully");
await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
onOpenChange(false);
```

This is the core deletion flow. `mutateAsync` calls the generated API delete endpoint, `invalidateQueries` refreshes the department list, and `onOpenChange(false)` closes the dialog.

From `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx`:

```tsx
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    ...
  };
}
```

This explains an important detail: `department.id` in the dialog is not a numeric database id. It is the public `slug`, which matches the backend’s external ID pattern.

From `frontend/src/features/admins/AdminDepartmentPage.tsx`:

```tsx
const handleDeleteDepartment = (department: DepartmentTableRow) => {
  setDeletingDepartment(department);
  setDeleteDepartmentOpen(true);
};
...
<DeleteDepartmentDialog
  department={deletingDepartment}
  open={deleteDepartmentOpen}
  onOpenChange={setDeleteDepartmentOpen}
/>
```

This is where the dialog gets opened and receives the selected department.

## Code Flow
1. User clicks **Delete** (trash icon) in `DepartmentsTable`.
2. `AdminDepartmentPage` sets selected row and opens `DeleteDepartmentDialog`.
3. `DeleteDepartmentDialog` renders warning UI and department name.
4. On confirm, `useAdminDeleteDepartment` sends API request using `{ slug }`.
5. On success, React Query cache for all departments is invalidated, so the table refetches updated data.
6. User sees either a success toast or an error toast.

## Important Details
- The dialog returns `null` if no department is selected, so it never runs delete logic without a valid target.
- The Remove button is disabled while request is pending (`isPending`), reducing duplicate submits.
- Error handling differentiates API errors (`ApiError`) from unknown errors, but keeps user-facing messages simple.
- The copy says “deactivate,” which aligns with soft-delete behavior expected in this project.

## In Everyday Words
This file is the safety step before removing a department. It confirms the action, does the removal through the backend, refreshes the list, and clearly tells the admin whether it worked.
