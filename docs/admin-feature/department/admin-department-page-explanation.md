# Admin Department Management Page (Plain English Walkthrough)

## Short Version
This page lets an admin see all departments, search through them, and move between pages of results. It also lets the admin add, edit, delete, and export departments as a CSV file. The main page itself only controls the screen state (which modal is open and which row is selected), while helper files handle data loading and API actions.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminDepartmentPage.tsx` | Main page layout and wiring between table/actions/modals. |
| `frontend/src/features/admins/manageDepartments/DepartmentsTable.tsx` | Renders searchable/paginated table and row action buttons. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Fetches department list from backend and manages pagination/search timing. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsCsvExport.tsx` | Handles export flow by fetching all pages and downloading CSV. |
| `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx` | Dialog form that validates and creates a department. |
| `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx` | Dialog form that validates and updates selected department. |
| `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx` | Confirmation dialog that soft-deletes selected department. |

## What Happens
1. The page renders the header, breadcrumbs, and two top buttons: **Export CSV** and **Add New Department**.
2. It renders `DepartmentsTable` and passes down:
   - the current search text,
   - the setter for search text,
   - callbacks for edit/delete clicks.
3. `DepartmentsTable` calls `useDepartmentsTable(search)` to fetch backend results with pagination and debounced search.
4. When a user clicks edit/delete on a row, the main page stores that row in state and opens the corresponding dialog.
5. Add/Edit/Delete dialogs call generated API hooks. On success, they invalidate the departments query so the table refreshes.
6. Export calls `useDepartmentsCsvExport`, which fetches all pages and creates a downloadable `departments.csv` file.

## Important Code Snippets
From `frontend/src/features/admins/AdminDepartmentPage.tsx`:
```tsx
const [editingDepartment, setEditingDepartment] = useState<DepartmentTableRow | null>(null);
const [deletingDepartment, setDeletingDepartment] = useState<DepartmentTableRow | null>(null);

const handleEditDepartment = (department: DepartmentTableRow) => {
  setEditingDepartment(department);
  setEditDepartmentOpen(true);
};
```
This is the key “selected row” pattern: the page remembers which department was clicked, then opens the matching dialog.

From `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx`:
```tsx
const { data, isError, isLoading } = useAdminGetAllDepartments(
  {
    Page: page,
    PageSize: DEPARTMENTS_PAGE_SIZE,
    Search: normalizedSearch || undefined,
  },
  {
    query: {
      placeholderData: keepPreviousData,
      refetchInterval: DEPARTMENTS_REFETCH_INTERVAL_MS,
    },
  },
);
```
This is where table data is fetched. It sends page, page size, and search text to the backend and keeps previous rows visible while changing pages.

From `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx`:
```tsx
validators: { onSubmit: addDepartmentSchema },
onSubmit: async ({ value }) => {
  const description = value.description.trim();

  await mutateAsync({
    data: {
      name: value.name.trim(),
      description: description.length > 0 ? description : null,
    },
  });
  form.reset();
},
```
This enforces validation before submit and normalizes input (trims whitespace, sends empty description as `null`).

From `frontend/src/features/admins/manageDepartments/UseDepartmentsCsvExport.tsx`:
```tsx
for (let page = 2; page <= totalPages; page += 1) {
  const pageResponse = await adminGetAllDepartments({
    Page: page,
    PageSize: DEPARTMENTS_EXPORT_PAGE_SIZE,
  });

  if (pageResponse.status !== 200) {
    toast.error("Failed to export departments.");
    return;
  }

  departments.push(...pageResponse.data.items);
}
```
This loop is the heart of export: it pulls every page from the backend so the CSV includes all departments, not only what is visible in the current table page.

## Code Flow
1. **Admin opens the page** (`AdminDepartmentPage`).
2. **Table requests data** through `useDepartmentsTable` using generated API hooks.
3. **Backend response is mapped** into `DepartmentTableRow` shape for rendering.
4. **Admin actions**:
   - Add button opens create dialog.
   - Edit/Delete icon in a row opens dialog with selected department.
   - Export button triggers CSV flow.
5. **Mutation success path** (create/edit/delete): show toast → invalidate departments query key → table refreshes.
6. **CSV path**: fetch total count, fetch all pages, convert rows to CSV, trigger browser download.

## Important Details
- Search input is debounced by 400ms to reduce unnecessary API calls while typing.
- Pagination is bounded and safe (cannot go below page 1 or above total pages).
- The table shows separate empty states for loading, error, and no-results.
- Form validation uses Zod before API calls.
- Error messages to users come from `ApiError` title when available; otherwise fallback generic messages are used.
- Department ID used in row actions is `slug` (`department.id = department.slug`), matching route/API expectations.

## In Everyday Words
This screen is a control panel for department records. It continuously keeps the list fresh, lets admins quickly find departments, safely update or remove one with confirmation, and export the full list to a spreadsheet-friendly file.
