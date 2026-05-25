# Admin Patients Page (Plain-English Explanation)

## Short Version
`AdminPatientsPage.tsx` is the staff-facing screen where admins can find, filter, view, edit, delete, add, and export patient records. It keeps local page state (search text, current page, selected patient, and dialog visibility), then fetches patient rows from the generated API hook. The page delegates the visual table and row actions to `PatientTable`, and opens separate dialog components for view/edit/delete/add actions.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Main page component that orchestrates state, API query, filters, table wiring, and dialogs. |
| `frontend/src/features/admins/managePatients/PatientTable.tsx` | Reusable table UI for search, pagination, and row-level actions. |
| `frontend/src/features/admins/managePatients/UsePatientsCsvExport.tsx` | CSV export logic used by the page’s **Export CSV** button. |
| `frontend/src/features/admins/managePatients/AddNewPatientForm.tsx` | Dialog opened from this page to register a new patient and optional record details. |
| `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx` | Dialog opened from this page to show full patient profile details. |

## What Happens
1. The page initializes UI state:
   - Which dialog is open (add/view/edit/delete).
   - Which patient is selected for each dialog.
   - Pagination page number.
   - Search input and applied search term.
   - Gender filter.
2. Typing in the search box does **debounced searching** (waits 400ms), then applies the search and resets to page 1.
3. The page builds API query params (`Page`, `PageSize`, optional `Search`, optional `Gender`) and calls the generated hook `useGetAllPatientsForClinicStaff`.
4. The API list auto-refreshes every second so the table stays fresh.
5. The returned paged result is transformed into:
   - `patients` rows
   - `totalCount`
   - `totalPages`
6. `PatientTable` receives data plus callbacks for view/edit/delete actions.
7. When the user clicks row actions, the page sets the selected patient and opens the matching dialog.
8. Export CSV triggers `usePatientsCsvExport`, which loops through paginated API responses and downloads a CSV file.

## Important Code Snippets
From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);

  return () => clearTimeout(timer);
}, [searchInput]);
```
This is the debounce logic: while typing, the page waits briefly before firing a new search, which avoids excessive requests.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
const patientListParams: GetAllPatientsForClinicStaffParams & { Gender?: string } = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};

const { data, isLoading } = useGetAllPatientsForClinicStaff(patientListParams, {
  query: {
    refetchInterval: PATIENTS_REFETCH_INTERVAL_MS,
  },
});
```
This builds the request payload and fetches the patient list using the generated API hook, with background refetch enabled.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
const handleViewPatient = (patient: ClinicStaffPatientDto) => {
  setSelectedPatient(patient);
  setViewPatientOpen(true);
};
```
The same pattern is used for edit and delete: store the selected patient, then open the corresponding modal.

From `frontend/src/features/admins/managePatients/PatientTable.tsx`:

```tsx
<Input
  id="patient-search"
  placeholder="Search by name..."
  value={search}
  onChange={(event) => onSearchChange(event.target.value)}
  className="h-9 pl-9 text-sm"
/>
```
The table does not own search state—it emits changes to the parent (`AdminPatientsPage`), which controls API querying.

From `frontend/src/features/admins/managePatients/UsePatientsCsvExport.tsx`:

```tsx
while (hasNextPage) {
  const response = await getAllPatientsForClinicStaff({
    Page: page,
    PageSize: PATIENTS_EXPORT_PAGE_SIZE,
  });

  if (response.status !== 200) {
    toast.error("Failed to export patients.");
    return;
  }

  patients.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```
CSV export is paginated under the hood, so it can include all patients (not only the current table page).

## Code Flow
1. Admin opens the Manage Patients page.
2. `AdminPatientsPage` fetches current patient rows.
3. Admin searches or applies gender filter.
4. Parent state changes, query params update, and the list refetches.
5. `PatientTable` renders rows and action buttons.
6. Clicking View/Edit/Delete opens the corresponding dialog with the selected patient.
7. Clicking Add New Patient opens registration form dialog.
8. Clicking Export CSV fetches all patient pages and downloads `patients.csv`.

## Important Details
- Search is debounced by 400ms to reduce rapid request churn.
- Changing search/filter resets pagination to page 1.
- The table is paginated at 5 rows per page in this page.
- Gender filter options map to backend codes (`M`, `F`, `O`, `N`).
- Auto-refresh is enabled every 1000ms (1 second).
- CSV export sanitizes cells (including spreadsheet-formula prefix protection) before download.

## In Everyday Words
This page is the admin’s patient control center. It shows a live-updating list of patients, lets staff narrow results quickly, and gives one-click actions to inspect, edit, remove, add, or export patient records in CSV format.
