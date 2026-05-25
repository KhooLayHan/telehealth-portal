# Admin Lab Technicians Page (`AdminLabTechsPage.tsx`)

## Short Version
This page is the admin screen for viewing and managing lab technician accounts. It fetches a paginated list from the backend, supports search and gender filtering, and lets admins open dialogs to add, view, edit, or deactivate a lab technician. It also includes a CSV export button so admins can download the current list.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminLabTechsPage.tsx` | Main page component that controls fetching, filtering, table rendering, and dialog states. |

## What Happens
1. The page starts with local state for pagination, search text, selected filters, and dialog visibility.
2. Search input is debounced for 400ms so API calls do not fire on every keystroke.
3. The page builds API parameters (`Page`, `PageSize`, optional `Search`, optional `Gender`).
4. It fetches lab technicians with `useAdminGetAllLabTechs(...)` and auto-refetches every second.
5. Depending on request state, it shows:
   - a loading message,
   - an error message, or
   - the `LabTechTable` with pagination, search, filter UI, and row actions.
6. When row actions are clicked, the page opens the corresponding dialog:
   - View details
   - Edit
   - Deactivate/Delete
7. "Add New Lab Tech" opens a creation form dialog.
8. "Export CSV" triggers `useLabTechCsvExport`.

## Important Code Snippets
From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
const PAGE_SIZE = 5;
const LAB_TECHS_REFETCH_INTERVAL_MS = 1000;
```

This sets small paginated pages and frequent refreshes (every 1 second), so admins see updates quickly.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    setSearch(searchInput);
    setPage(1);
  }, 400);

  return () => clearTimeout(timer);
}, [searchInput]);
```

This is the search debounce. It waits briefly before applying search text and resets to page 1 when search changes.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
const labTechListParams: AdminGetAllLabTechsParams & { Gender?: string } = {
  Page: page,
  PageSize: PAGE_SIZE,
  Search: search.trim() || undefined,
  Gender: genderFilter || undefined,
};
```

This object is the API query payload. Empty values are converted to `undefined`, so only active filters are sent.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
const { data, isLoading, isError } = useAdminGetAllLabTechs(labTechListParams, {
  query: {
    refetchInterval: LAB_TECHS_REFETCH_INTERVAL_MS,
  },
});
```

This calls the generated API hook and enables periodic background refetching.

From `frontend/src/features/admins/AdminLabTechsPage.tsx`:

```tsx
{isLoading ? (
  <div className="flex h-48 items-center justify-center">
    <p className="text-muted-foreground text-sm tracking-wide">
      Loading lab technicians...
    </p>
  </div>
) : isError ? (
  <div className="flex h-48 items-center justify-center">
    <p className="text-destructive text-sm">Failed to load lab technicians.</p>
  </div>
) : (
  <LabTechTable
```

This is the core UI state branching: loading, error, or the interactive table view.

## Code Flow
1. Admin opens the "Lab Technician Directory" page.
2. Page initializes state and immediately fetches first-page lab technicians.
3. Admin types in search → 400ms debounce applies search and resets paging.
4. Admin applies gender filters via popover buttons.
5. Updated params trigger refetch; table updates with backend results.
6. Admin clicks row actions:
   - `onView` opens details dialog,
   - `onEdit` opens edit form,
   - `onDeactivate` opens deactivate/delete dialog.
7. Admin can export CSV or open "Add New Lab Tech" dialog.

## Important Details
- Gender filter options are fixed to: Male (`M`), Female (`F`), Other (`O`), Not specified (`N`).
- Active filter count is shown as a badge on the Filters button.
- Clear filters resets gender and jumps back to page 1.
- Dialog components are always mounted in the page tree and controlled via `open` state props.

## In Everyday Words
This page is a control panel for admins to manage lab technicians. It helps them quickly find people with search and filters, open profile/action dialogs, and download a CSV report when needed.
