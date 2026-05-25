# Admin Appointment Page (Plain English Explanation)

## Short Version
`AdminAppointmentPage` is the admin screen where staff can view appointments in two ways: a month calendar and a paginated list. It lets admins search, filter by status, show only today’s records, and export all appointments to CSV. The page delegates data loading to custom hooks and delegates UI rendering to dedicated calendar and table components.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/AdminAppointmentPage.tsx` | Main page component that manages view mode, filters, and layout. |
| `frontend/src/features/admins/manageAppointments/UseAdminAppointments.tsx` | Hook that fetches appointment and status data for both calendar and list views. |
| `frontend/src/features/admins/manageAppointments/UseAppointmentsCsvExport.tsx` | Hook that fetches all pages and downloads a CSV export. |
| `frontend/src/features/admins/manageAppointments/AppointmentCalendar.tsx` | Calendar-side UI that shows month view and today-focused panel. |
| `frontend/src/features/admins/manageAppointments/AppointmentTable.tsx` | List-side UI with pagination and status badges. |

## What Happens
1. The page starts in **calendar view** and initializes current date values (year, month, day).
2. It tracks UI state for:
   - selected month/day
   - list page number
   - free-text search
   - status filter
   - “today only” toggle
3. It calls `useAdminAppointments(...)` with the current state.
   - In calendar mode, month-level polling is active.
   - In list mode, list polling is active.
4. If the admin switches to **List View**, filter controls appear.
5. The user can search and filter; each filter reset also resets list pagination to page 1.
6. Pressing **Export CSV** calls a separate hook that repeatedly requests all appointment pages and downloads one CSV file.
7. The content area animates between:
   - `AppointmentCalendar` in calendar mode
   - `AppointmentTable` in list mode

## Important Code Snippets
From `frontend/src/features/admins/AdminAppointmentPage.tsx`:

```tsx
const {
  monthItems,
  scheduledDays,
  todayAppointments,
  isMonthLoading,
  listItems,
  listTotalPages,
  isListLoading,
  statuses,
} = useAdminAppointments(
  currentYear,
  currentMonth,
  listPage,
  search,
  {
    status: statusFilter,
    todayOnly,
  },
  viewMode === "calendar",
  viewMode === "list",
);
```

This is the center of the page logic: it asks one hook for all calendar/list data while turning polling on/off based on the active tab.

From `frontend/src/features/admins/AdminAppointmentPage.tsx`:

```tsx
<Input
  type="search"
  placeholder="Search by patient name, doctor, or visit reason..."
  value={search}
  onChange={(event) => {
    setSearch(event.target.value);
    setListPage(1);
  }}
  className="pl-9"
/>
```

When search text changes, the page automatically returns to page 1 so results stay consistent for the new query.

From `frontend/src/features/admins/manageAppointments/UseAdminAppointments.tsx`:

```tsx
const listQuery = useGetAllAppointmentsForReceptionist(
  {
    PageSize: 5,
    Page: listPage,
    SortOrder: "asc",
    ...(search.trim() ? { Search: search.trim() } : {}),
    ...(filters.status ? { Status: filters.status } : {}),
    ...(filters.todayOnly ? { From: todayIso, To: todayIso } : {}),
  },
  {
    query: {
      refetchInterval: shouldPollList ? APPOINTMENT_REFETCH_INTERVAL_MS : false,
    },
  },
);
```

This is how list filtering works: it only sends search/status/today constraints when they are active.

From `frontend/src/features/admins/manageAppointments/UseAppointmentsCsvExport.tsx`:

```tsx
while (hasNextPage) {
  const response = await getAllAppointmentsForReceptionist({
    Page: page,
    PageSize: APPOINTMENTS_EXPORT_PAGE_SIZE,
    SortOrder: "asc",
  });

  if (response.status !== 200) {
    toast.error("Failed to export appointments.");
    return;
  }

  appointments.push(...response.data.items);
  hasNextPage = response.data.hasNextPage ?? false;
  page += 1;
}
```

The export does not just download the current visible page. It loops through every backend page and builds one full CSV.

## Code Flow
1. Admin opens appointment page.
2. `AdminAppointmentPage` initializes date/filter/view state.
3. `useAdminAppointments` runs month query, list query, and status query.
4. Calendar view renders with dots for scheduled days and today’s appointment panel.
5. List view renders table with pagination, search, and filters.
6. Export button triggers `useAppointmentsCsvExport`, which fetches all pages, builds CSV, and starts browser download.

## Important Details
- **Two independent data contexts** are used:
  - month data for calendar dots + “today” panel
  - paged list data for table view
- **Polling behavior is mode-aware** (calendar polling only in calendar mode, list polling only in list mode).
- **Filter badge count** is computed from active status + today-only toggle.
- **CSV safety handling** escapes commas/quotes/newlines and prefixes formula-like values to reduce spreadsheet injection risk.
- **User feedback** for export outcomes uses toast messages (success, empty export, failure).

## In Everyday Words
This page is the admin’s appointment control center. They can quickly browse the month, inspect today’s schedule, switch to a detailed table, narrow results with filters, and download a complete appointment report as a CSV file.
