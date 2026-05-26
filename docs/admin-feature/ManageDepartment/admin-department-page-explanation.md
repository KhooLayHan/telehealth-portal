# AdminDepartmentPage.tsx Explanation

## Short Version
`AdminDepartmentPage` is the admin UI screen for managing departments. It acts as a coordinator component: it shows page-level layout (breadcrumbs, title, action buttons), keeps local UI state (search text + open/close state for dialogs), and wires that state into child components that do the actual data work. The data operations (list, create, update, delete, and CSV export) are handled by dedicated hooks/components under `manageDepartments/`, which call Orval-generated API hooks and then refresh department queries with TanStack Query invalidation.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminDepartmentPage.tsx` | Main page component the user asked about; owns UI state and composes all department sub-features. |
| `frontend/src/features/admins/manageDepartments/DepartmentsTable.tsx` | Renders searchable/paginated department list and emits edit/delete actions back to page. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsTable.tsx` | Fetches paginated departments from backend using generated `useAdminGetAllDepartments` query hook. |
| `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx` | Handles create flow with validation + `useAdminCreateDepartment` mutation. |
| `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx` | Handles update flow with validation + `useAdminUpdateDepartment` mutation. |
| `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx` | Handles delete flow with `useAdminDeleteDepartment` mutation. |
| `frontend/src/features/admins/manageDepartments/UseDepartmentsCsvExport.tsx` | Handles full CSV export flow using generated API client calls across all pages. |

## Technical Flow
1. The page renders headers and buttons, and defines local state for:
   - add dialog open state
   - edit dialog open state + selected row
   - delete dialog open state + selected row
   - search text
2. Search text is passed into `DepartmentsTable`, which passes it to `useDepartmentsTable(search)`.
3. `useDepartmentsTable` debounces search input, calls backend list endpoint via generated query hook, and returns rows + pagination controls.
4. Clicking edit/delete in a table row sends the selected department back to page callbacks (`handleEditDepartment`, `handleDeleteDepartment`).
5. The page opens the corresponding dialog and passes the selected department row into edit/delete components.
6. Create/update/delete forms call generated mutation hooks. On success they invalidate `getAdminGetAllDepartmentsQueryKey()` so the table refetches and UI stays fresh.
7. Clicking “Export CSV” calls `exportDepartmentsCsv()`, which fetches all pages from backend and triggers browser download.

## Frontend Code
From `frontend/src/features/admins/AdminDepartmentPage.tsx`:
```tsx
const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
const [editDepartmentOpen, setEditDepartmentOpen] = useState(false);
const [deleteDepartmentOpen, setDeleteDepartmentOpen] = useState(false);
const [departmentSearch, setDepartmentSearch] = useState("");
const [editingDepartment, setEditingDepartment] = useState<DepartmentTableRow | null>(null);
const [deletingDepartment, setDeletingDepartment] = useState<DepartmentTableRow | null>(null);
```
This is the page’s local UI state. It does **not** directly fetch data or submit API requests. It controls which modal is open and which row is currently selected.

From `frontend/src/features/admins/AdminDepartmentPage.tsx`:
```tsx
<DepartmentsTable
  search={departmentSearch}
  onSearchChange={setDepartmentSearch}
  onEditDepartment={handleEditDepartment}
  onDeleteDepartment={handleDeleteDepartment}
/>
<AddNewDepartmentForm open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen} />
<EditDepartmentForm
  department={editingDepartment}
  open={editDepartmentOpen}
  onOpenChange={setEditDepartmentOpen}
/>
<DeleteDepartmentDialog
  department={deletingDepartment}
  open={deleteDepartmentOpen}
  onOpenChange={setDeleteDepartmentOpen}
/>
```
This is the composition pattern: page-level state and callbacks are passed down to specialized child components.

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
This generated hook is the read endpoint integration. It sends pagination + optional search to backend and keeps prior page data during page changes (`keepPreviousData`) for smoother UX.

From `frontend/src/features/admins/manageDepartments/AddNewDepartmentForm.tsx`:
```tsx
const { mutateAsync, isPending } = useAdminCreateDepartment({
  mutation: {
    onSuccess: async () => {
      toast.success("Department created successfully");
      await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
      onOpenChange(false);
    },
  },
});
```
Create uses a generated mutation hook. After success it invalidates department-list cache so table data refreshes.

From `frontend/src/features/admins/manageDepartments/EditDepartmentForm.tsx`:
```tsx
await mutateAsync({
  slug: department.id,
  data: {
    name: value.name.trim(),
    description: description.length > 0 ? description : null,
  },
});
```
Edit sends the row’s `id` as `slug` route parameter. In this feature, the external department identifier is slug-based.

From `frontend/src/features/admins/manageDepartments/DeleteDepartmentDialog.tsx`:
```tsx
await mutateAsync({ slug: department.id });
toast.success("Department deleted successfully");
await queryClient.invalidateQueries({ queryKey: getAdminGetAllDepartmentsQueryKey() });
```
Delete also relies on slug and then invalidates the same list query key.

From `frontend/src/features/admins/manageDepartments/UseDepartmentsCsvExport.tsx`:
```tsx
for (let page = 2; page <= totalPages; page += 1) {
  const pageResponse = await adminGetAllDepartments({
    Page: page,
    PageSize: DEPARTMENTS_EXPORT_PAGE_SIZE,
  });
  departments.push(...pageResponse.data.items);
}

downloadCsvFile(DEPARTMENTS_CSV_FILE_NAME, buildDepartmentsCsv(departments));
```
CSV export is not just “current page export” — it fetches **all pages** and builds one CSV file.

## Backend Code
No backend files are directly imported by this page. `AdminDepartmentPage.tsx` connects to backend **indirectly** through Orval-generated client/hooks from `@/api/generated/admins/admins` (used inside the child hooks/forms). So the backend route/handler trace cannot be confirmed from this page alone without separately tracing generated API operation mappings.

## End-to-End Code Flow
1. Admin opens Manage Departments screen.
2. `AdminDepartmentPage` renders table and action dialogs with initial local state.
3. `DepartmentsTable` + `useDepartmentsTable` call `useAdminGetAllDepartments` to load paginated rows.
4. Admin types search text; query is debounced and page resets to 1.
5. Admin clicks:
   - **Add New Department** → create dialog opens → submit triggers `useAdminCreateDepartment`.
   - **Edit icon** on row → selected row stored in state → edit dialog opens → submit triggers `useAdminUpdateDepartment` with row slug.
   - **Delete icon** on row → selected row stored in state → confirm triggers `useAdminDeleteDepartment` with row slug.
6. Successful mutations invalidate the shared department list query key and table refreshes.
7. Admin clicks **Export CSV**; hook fetches all pages and downloads `departments.csv`.

## Important Details
- The table row `id` is built from `department.slug`, not numeric ID, which matches the project’s “slug for lookup-style records” strategy.
- Search is debounced by 400ms to reduce request spam.
- Query refetch interval is set to 1000ms, so data auto-refreshes frequently.
- Frontend validation is done via Zod (`addDepartmentSchema`, `editDepartmentSchema`) before mutation.
- API errors are normalized through `ApiError` and shown with user-friendly toast messages.
- All create/update/delete success paths invalidate the same list query key to keep UI consistent.

## Beginner Programmer Notes
- **Generated hook**: a prebuilt function from OpenAPI spec (Orval) so you don’t hand-write fetch calls.
- **Mutation**: a write action (create/edit/delete), usually followed by cache invalidation.
- **Query invalidation**: tells TanStack Query “this cached data is stale, fetch again.”
- **Debounce**: wait a short time before sending request so every keystroke doesn’t trigger network calls.
- **Dialog control state** in the page lets one parent component coordinate several child components cleanly.
