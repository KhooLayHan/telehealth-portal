# ViewReceptionistDetailDialog.tsx Explanation

## Short Version
`ViewReceptionistDetailDialog` is a presentational React dialog that shows full receptionist profile details when an admin clicks “view” on a receptionist row. It does not fetch data by itself; it receives one `AdminReceptionistDto` object from the parent page and renders fallback values for missing fields. It also includes small helper functions (`genderLabel`, `formatDate`, `getInitials`) to convert raw API values into UI-friendly text. The dialog is opened and closed by state managed in `AdminReceptionistsPage`. 

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageReceptionists/ViewReceptionistDetailDialog.tsx` | Main component and local helper functions being explained. |
| `frontend/src/features/admins/AdminReceptionistsPage.tsx` | Parent page that owns dialog open state and passes the selected receptionist object. |
| `frontend/src/api/model/AdminReceptionistDto.ts` | Generated DTO type that defines the data shape used by the dialog. |

## Technical Flow
1. The admin page renders a receptionist table and passes an `onView` callback (`handleView`) to the table.
2. When a receptionist row triggers view, `handleView` stores the selected receptionist in state and sets `dialogOpen` to `true`.
3. `AdminReceptionistsPage` renders `ViewReceptionistDetailDialog` with three props:
   - `receptionist` (selected row data)
   - `open` (boolean modal state)
   - `onOpenChange` (state setter)
4. Inside the dialog component, it returns `null` if `receptionist` is `null` (safe guard to avoid rendering empty content).
5. For rendering, helper functions transform values:
   - `genderLabel` maps API codes (`M/F/O/N`) to readable labels.
   - `formatDate` converts API date-like values to `en-GB` display format.
   - `getInitials` builds fallback avatar initials.
6. The UI shows two sections:
   - Personal Information (gender, date of birth, phone, IC number)
   - Address (full address + per-field rows) or an empty-state panel.

## Frontend Code
From `frontend/src/features/admins/AdminReceptionistsPage.tsx`:

```tsx
const handleView = (receptionist: AdminReceptionistDto) => {
  setSelectedReceptionist(receptionist);
  setDialogOpen(true);
};

<ViewReceptionistDetailDialog
  receptionist={selectedReceptionist}
  open={dialogOpen}
  onOpenChange={setDialogOpen}
/>
```

This is the entry point for the dialog flow. The parent owns state, so the dialog itself stays reusable and “dumb” (presentation-only).

From `frontend/src/features/admins/manageReceptionists/ViewReceptionistDetailDialog.tsx`:

```tsx
if (!receptionist) {
  return null;
}

const initials = getInitials(receptionist);
```

This is a defensive render pattern. If no receptionist is selected, React renders nothing.

From `frontend/src/features/admins/manageReceptionists/ViewReceptionistDetailDialog.tsx`:

```tsx
function genderLabel(code: string | null | undefined): string {
  if (!code) {
    return "N/A";
  }

  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}
```

This helper normalizes compact backend codes into readable UI values while still showing unknown values safely.

From `frontend/src/features/admins/manageReceptionists/ViewReceptionistDetailDialog.tsx`:

```tsx
function formatDate(value: unknown): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
```

This helper prevents broken date strings from crashing display and guarantees a consistent fallback.

From `frontend/src/features/admins/manageReceptionists/ViewReceptionistDetailDialog.tsx`:

```tsx
{receptionist.avatarUrl ? (
  <img
    src={receptionist.avatarUrl}
    alt={`${receptionist.firstName} ${receptionist.lastName}`}
    className="size-14 shrink-0 rounded-full border border-border object-cover"
  />
) : (
  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
    {initials}
  </div>
)}
```

This conditional render uses profile image when available and falls back to generated initials for a consistent avatar experience.

## Backend Code
There is no direct backend call in `ViewReceptionistDetailDialog.tsx`. The component consumes data already fetched by the parent through generated API hooks.

Data contract used by this dialog comes from generated frontend model:

From `frontend/src/api/model/AdminReceptionistDto.ts`:

```ts
export interface AdminReceptionistDto {
  publicId?: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string | null;
  slug: string;
  icNumber: string;
  gender: string;
  dateOfBirth?: LocalDate;
  avatarUrl?: string | null;
  address?: null | Address;
  createdAt?: Instant;
  deletedAt?: null | Instant;
}
```

So this dialog is the final UI consumer of this DTO shape, not the data fetcher.

## End-to-End Code Flow
1. Admin opens the receptionist directory page.
2. Parent page fetches receptionist list via generated hook (`useAdminGetAllReceptionists`).
3. User clicks a “view details” action in the receptionist table.
4. Parent `handleView` stores selected row DTO and toggles dialog open state.
5. `ViewReceptionistDetailDialog` receives props and renders identity, personal details, and address.
6. If data is missing (`avatarUrl`, `phoneNumber`, `address`, invalid date), fallback text/panels are shown.
7. Closing the dialog triggers `onOpenChange`, which updates parent state.

## Important Details
- This component is intentionally presentational and side-effect free: no API call, no mutation, no query invalidation.
- It handles nullable/optional fields safely (`phoneNumber`, `avatarUrl`, `address`, `dateOfBirth`) to avoid runtime UI breakage.
- It currently displays `icNumber` directly. Because this is PHI/PII in healthcare contexts, ensure downstream requirements allow this visibility for admin users.
- `formatDate` uses browser locale formatting with explicit `en-GB`; this means `LocalDate` is displayed consistently as day-month-year text for users.

## Beginner Programmer Notes
- **DTO (Data Transfer Object):** A typed object shape sent between backend and frontend. Here, `AdminReceptionistDto` defines what receptionist fields exist.
- **Presentational component:** A component focused on rendering UI from props, while parent components handle data fetching and state.
- **Fallback rendering:** UI defaults like `"N/A"` or initials prevent blank/broken screens when optional data is missing.
- **Controlled dialog:** The dialog’s open/close state is controlled by parent props (`open`, `onOpenChange`) instead of internal local state.
