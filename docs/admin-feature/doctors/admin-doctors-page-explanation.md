# Admin Doctors Page (Plain English Walkthrough)

## Short Version
`AdminDoctorsPage.tsx` is the admin screen used to view and manage the doctor directory. It fetches doctor records from the backend, lets admins search and filter doctors, shows paginated cards, and opens dialogs for viewing details, editing, deleting, scheduling, and adding doctors. It also supports exporting the current filtered list into a CSV file.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminDoctorsPage.tsx` | Main page logic and UI for listing/filtering doctors and exporting CSV. |
| `frontend/src/api/generated/doctors/doctors.ts` | Provides `useGetAll` and `getAll` functions used for doctor fetching and CSV export pagination. |
| `frontend/src/api/generated/admins/admins.ts` | Provides `useAdminGetAllDepartments` used to build department filter options. |

## What Happens
1. The page keeps local state for current page number, search text, active filters, and which dialog/modal is open.
2. It calls `useGetAll` to load doctors for the current page (6 per page) and automatically refreshes every second.
3. It separately loads departments for filter chips and loads up to 50 doctors once to derive specialization filter options.
4. Search is debounced by 400ms, so typing does not immediately trigger a request on every keypress.
5. Doctors are shown as cards. Each card action (view/edit/remove/schedule) finds that doctor in memory and opens the corresponding dialog.
6. Export CSV fetches all pages from the API (not just the visible page), converts data into safe CSV rows, then triggers a browser download.

## Important Code Snippets
From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
const { data, isLoading, isError } = useGetAll(
  {
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
    Department: departmentFilter || undefined,
    Specialization: specializationFilter || undefined,
  },
  {
    query: {
      refetchInterval: DOCTORS_REFETCH_INTERVAL_MS,
    },
  },
);
```

This is the main doctor list fetch. It sends pagination, search, and filter values to the backend. `refetchInterval` makes the page auto-refresh every 1 second.

From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);
  return () => clearTimeout(timer);
}, [searchInput]);
```

This is a debounce: it waits 400ms after typing stops, then updates actual search criteria and resets to page 1.

From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
const safeText = CSV_FORMULA_PREFIX_PATTERN.test(text) ? `'${text}` : text;
return `"${safeText.replaceAll('"', '""')}"`;
```

This protects CSV output from spreadsheet formula injection by prefixing risky values and escaping quotes.

From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
for (let exportPage = 2; exportPage <= exportTotalPages; exportPage++) {
  const response = await getAll({
    Page: exportPage,
    PageSize: exportPageSize,
    Search: search || undefined,
    Department: departmentFilter || undefined,
    Specialization: specializationFilter || undefined,
  });

  if (response.status !== 200) {
    toast.error("Failed to export doctor records.");
    return;
  }

  exportedDoctors.push(...response.data.items);
}
```

This loop ensures CSV export includes all filtered doctors across every backend page, not only the current visible page.

## Code Flow
1. Admin opens Doctor Directory page.
2. Page fetches doctors + departments + specialization source data.
3. Admin searches or applies filters.
4. Page reloads data with those query parameters.
5. Admin interacts with a card action:
   - View Details → opens details dialog
   - Edit Profile → opens edit form dialog
   - Remove → opens delete confirmation dialog
   - Schedule → opens schedule dialog
6. If admin clicks Export CSV, page fetches all filtered pages, builds CSV, and downloads `doctors-YYYY-MM-DD.csv`.

## Important Details
- **Pagination UX:** If filters/search reduce available pages and current page becomes invalid, the page auto-corrects to the highest valid page.
- **Filter chips:** Department options come from department API; specialization options are derived from loaded doctor directory data.
- **Loading and errors:** The UI clearly shows loading, error, empty state, or card grid state.
- **Toasts:** Export operation provides immediate feedback for success and failures.

## In Everyday Words
This page is the admin’s control panel for doctors. It lets them quickly find doctors, narrow down results, manage each doctor record, and download a full spreadsheet of what they’re currently looking at.
