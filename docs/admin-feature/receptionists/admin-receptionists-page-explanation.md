# Admin Receptionists Page — Plain English Explanation

## Short Version
This page is the admin screen for viewing and managing receptionist accounts. It loads receptionist records from the backend, supports search and gender filtering, allows paging through results, and provides actions to view details, edit, add, deactivate, and export records to CSV. The page also refreshes data regularly so the list stays up to date.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminReceptionistsPage.tsx` | Main page logic and UI wiring for receptionist management. |
| `frontend/src/features/admins/manageReceptionists/ReceptionistTable.tsx` | Displays data, search box, row actions, and pagination controls. |
| `frontend/src/features/admins/manageReceptionists/UseReceptionistsCsvExport.tsx` | Handles CSV export logic and download behavior. |
| `frontend/src/api/generated/admins/admins.ts` | Generated API hooks/functions used to fetch receptionist data. |

## What Happens
1. The page keeps internal state for current page number, search input, finalized search term, gender filter, and open/close state for each dialog.
2. When the user types in search, the page waits 400ms before applying it (debounce behavior), then resets back to page 1.
3. The page calls the generated `useAdminGetAllReceptionists` hook with page, page size, search, and gender values.
4. The data refreshes every second (`refetchInterval`) to keep the list fresh.
5. If loading fails, it shows an error message. If successful, it renders the `ReceptionistTable`.
6. The table receives callbacks for row actions:
   - View → opens detail dialog
   - Edit → opens edit form dialog
   - Deactivate → opens delete/deactivate dialog
7. The page also provides two top-level actions:
   - Add New Receptionist → opens add form dialog
   - Export CSV → gathers matching data across pages and downloads `receptionists.csv`

## Important Code Snippets
From `frontend/src/features/admins/AdminReceptionistsPage.tsx`
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);
  return () => clearTimeout(timer);
}, [searchInput]);
```
This creates the delayed search behavior so API calls are not fired on every keystroke immediately.

From `frontend/src/features/admins/AdminReceptionistsPage.tsx`
```tsx
const { data, isLoading, isError } = useAdminGetAllReceptionists(receptionistListParams, {
  query: {
    refetchInterval: RECEPTIONISTS_REFETCH_INTERVAL_MS,
  },
});
```
This is where the page requests receptionist data and enables periodic auto-refresh.

From `frontend/src/features/admins/AdminReceptionistsPage.tsx`
```tsx
const receptionistListParams: AdminGetAllReceptionistsParams = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};
```
This defines what the backend query receives: pagination, optional search, and optional gender filter.

From `frontend/src/features/admins/manageReceptionists/UseReceptionistsCsvExport.tsx`
```tsx
while (hasNextPage) {
  const response = await adminGetAllReceptionists({
    ...params,
    Page: page,
    PageSize: RECEPTIONISTS_EXPORT_PAGE_SIZE,
  });

  if (response.status !== 200) {
    toast.error("Failed to export receptionists.");
    return;
  }

  receptionists.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```
This loop fetches all matching receptionist pages before creating one combined CSV file.

## Code Flow
1. **Admin opens Receptionist Directory page**.
2. **Page initializes state** for search/filter/pagination/dialogs.
3. **Generated API hook runs** with current query parameters.
4. **UI renders** loading, error, or table depending on request state.
5. **User interactions** (search/filter/pagination/actions) update state.
6. **State change triggers re-fetch** and table refresh.
7. **Dialogs open** for view/edit/add/deactivate flows when action buttons are clicked.
8. **CSV export action** fetches all pages and downloads the file.

## Important Details
- Search is intentionally delayed by 400ms to reduce noisy network calls.
- Filter count badge on the Filters button reflects active filters.
- API response is only used when status is `200`; otherwise, safe fallbacks are used.
- CSV export protects against broken CSV cells by escaping quotes/newlines and prefixing formula-like values.
- Export uses toast notifications for success/failure and empty-result feedback.

## In Everyday Words
This screen is the admin’s control panel for receptionist accounts. It lets admins quickly find people, narrow results, open details, edit or deactivate records, add new receptionists, and download the list as a spreadsheet-friendly CSV.
