# ViewPatientDetailDialog.tsx Explanation

## Short Version
`ViewPatientDetailDialog` is a React dialog component that shows a full patient profile card when an admin clicks the **View** action in the patient table. It receives a selected `ClinicStaffPatientDto` object and renders personal details, allergies, and emergency contact information with sensible fallbacks like `"N/A"` and `"No known allergies."`. The dialog itself does not fetch data; it only displays whatever patient data is passed from `AdminPatientsPage`.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx` | Main component requested; contains formatting helpers and UI rendering logic for patient details. |
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Parent page that controls dialog open state and passes the selected patient into this dialog. |
| `frontend/src/features/admins/managePatients/PatientTable.tsx` | Source of the “View patient details” action that triggers dialog opening via callback. |
| `frontend/src/api/model/ClinicStaffPatientDto.ts` | Generated DTO type that defines all fields this dialog can render. |

## Technical Flow
1. `AdminPatientsPage` fetches patient list records using `useGetAllPatientsForClinicStaff(...)`.
2. `AdminPatientsPage` passes `handleViewPatient` into `PatientTable` as `onView`.
3. In `PatientTable`, the Eye button calls `meta.onView?.(row.original)`, sending the full selected patient object back to the page.
4. `handleViewPatient` sets `selectedPatient` and sets `viewPatientOpen` to `true`.
5. `AdminPatientsPage` renders:
   ```tsx
   <ViewPatientDetailDialog
     patient={selectedPatient}
     open={viewPatientOpen}
     onOpenChange={setViewPatientOpen}
   />
   ```
6. `ViewPatientDetailDialog` checks `if (!patient) return null;` to avoid rendering an empty dialog.
7. If a patient exists, helper functions (`getInitials`, `genderLabel`, `formatDate`) transform raw API data into user-friendly display strings.
8. The dialog displays three sections:
   - Personal Information
   - Allergies
   - Emergency Contact

## Frontend Code
From `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx`:

```tsx
export function ViewPatientDetailDialog({
  patient,
  open,
  onOpenChange,
}: ViewPatientDetailDialogProps) {
  if (!patient) {
    return null;
  }

  const initials = getInitials(patient);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
```

This makes the component **purely presentational**: it shows UI only when there is a selected patient and uses the parent-provided `open` state.

From `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx`:

```tsx
function formatDate(value: unknown): string {
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

This helper defensively handles invalid or missing date values and formats valid dates for display as day-month-year text (for example, `24 Jan 2001`).

From `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx`:

```tsx
{!patient.allergies || patient.allergies.length === 0 ? (
  <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
    No known allergies.
  </p>
) : (
  patient.allergies.map((allergy) => {
```

This branch handles nullable API data correctly. If allergies are missing or empty, the UI clearly says so; otherwise it renders one allergy card per item.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:

```tsx
const handleViewPatient = (patient: ClinicStaffPatientDto) => {
  setSelectedPatient(patient);
  setViewPatientOpen(true);
};
```

This is the event bridge from table row action to dialog display.

From `frontend/src/features/admins/managePatients/PatientTable.tsx`:

```tsx
<Button
  ...
  aria-label="View patient details"
  title="View patient details"
  onClick={() => meta.onView?.(row.original)}
>
  <Eye className="size-3.5" />
</Button>
```

This is where a user click becomes a callback carrying the selected patient object.

## Backend Code
There is no backend logic inside `ViewPatientDetailDialog.tsx`. It consumes already-fetched DTO data.

The data contract comes from generated OpenAPI types:

From `frontend/src/api/model/ClinicStaffPatientDto.ts`:

```ts
export interface ClinicStaffPatientDto {
  patientPublicId: string;
  slug: string;
  username: string;
  email: string;
  icNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: LocalDate;
  phoneNumber: string;
  bloodGroup: string;
  gender: string;
  allergies: AllergyDto[] | null;
  emergencyContact: null | EmergencyContactDto;
  joinedAt: Instant;
}
```

So the dialog depends on backend responses including `allergies` and `emergencyContact` fields in this shape.

## End-to-End Code Flow
1. Admin lands on `AdminPatientsPage` and patient list query runs.
2. `PatientTable` renders each patient and action buttons.
3. Admin clicks the Eye icon on a row.
4. `PatientTable` calls `onView` with `row.original`.
5. `AdminPatientsPage` stores that object in `selectedPatient` and opens `ViewPatientDetailDialog`.
6. `ViewPatientDetailDialog` renders patient initials, name, blood group, gender, DOB, allergies, and emergency contact.
7. Closing the dialog calls `onOpenChange`, which updates page state and hides the dialog.

## Important Details
- The dialog gracefully handles missing values with fallbacks (`N/A`, `No phone on record`, `No known allergies`, `No emergency contact on record`).
- Severity color styling is centralized in `SEVERITY_STYLES`, with a safe default style for unknown severity values.
- The key used for allergy rows combines allergen + severity + reaction, helping keep list rendering stable.
- `genderLabel` maps compact backend codes (`M`, `F`, `O`, `N`) to user-facing labels.
- This component currently displays sensitive fields like IC number and phone number in admin UI; that can be valid for authorized staff views, but should remain access-controlled by page-level auth.

## Beginner Programmer Notes
- A **DTO** (Data Transfer Object) is the shape of data sent over the API; here that type is `ClinicStaffPatientDto`.
- A **presentational component** is a component focused on rendering UI from props, without owning data fetching logic.
- `row.original` in TanStack Table is the full original record for that row, not just one cell value.
- Utility helpers like `formatDate` and `genderLabel` keep JSX cleaner and make display logic easier to test/reuse.
