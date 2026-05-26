# ViewDoctorDetailDialog.tsx Explanation

## Short Version
`ViewDoctorDetailDialog` is a read-only modal dialog that shows a doctor's complete profile in a tabbed layout (Personal, Professional, Address, Qualifications). It receives one selected `DoctorListDto` record and a boolean open state from `AdminDoctorsPage`, then formats optional/missing values so the UI stays stable and user-friendly. This component does not fetch data or submit data; it is a pure presentation component that displays already-loaded doctor data.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx` | Main component and helper formatting functions for display logic. |
| `frontend/src/features/admins/AdminDoctorsPage.tsx` | Parent page that passes selected doctor and dialog open state into `ViewDoctorDetailDialog`. |
| `frontend/src/api/model/DoctorListDto.ts` | Generated API DTO type that defines the shape of doctor data used by the dialog. |

## Technical Flow
1. A doctor is selected on the admin doctors page, and the page sets `selectedDoctor` plus `detailsOpen` state.
2. `AdminDoctorsPage` renders `<ViewDoctorDetailDialog doctor={selectedDoctor} open={detailsOpen} onOpenChange={setDetailsOpen} />`.
3. Inside `ViewDoctorDetailDialog`, if `doctor` is `null`, it returns `null` immediately (no dialog shown).
4. If `doctor` exists, the component builds fallback-safe display strings using helper functions:
   - `formatValue` for generic text fields.
   - `formatDate` for date-like values.
   - `formatConsultationFee` for currency display (MYR locale formatting).
5. The dialog UI is grouped into tabs so the user can review profile details in sections instead of one long form.
6. Qualification rows are rendered dynamically from `doctor.qualifications`; if empty, a placeholder message is shown.
7. Closing the dialog calls `onOpenChange`, which updates parent state in `AdminDoctorsPage`.

## Frontend Code
From `frontend/src/features/admins/AdminDoctorsPage.tsx`:
```tsx
<ViewDoctorDetailDialog
  doctor={selectedDoctor}
  open={detailsOpen}
  onOpenChange={setDetailsOpen}
/>
```
This shows the parent-child contract clearly: the parent owns state, while the dialog only displays data and emits open/close changes.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:
```tsx
interface ViewDoctorDetailDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewDoctorDetailDialog({ doctor, open, onOpenChange }: ViewDoctorDetailDialogProps) {
  if (!doctor) return null;
  ...
}
```
This pattern prevents rendering errors when no doctor is selected yet.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:
```tsx
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return notProvided;
  }
  return String(value);
}
```
This creates consistent fallback behavior (`"Not provided"`) across many fields.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:
```tsx
function formatConsultationFee(value: DoctorListDto["consultationFee"]): string {
  if (value === null || value === undefined || value === "") {
    return notProvided;
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amount);
}
```
Because the generated DTO allows `number | string | null`, this function safely handles all possible types and formats valid numbers as Malaysian Ringgit.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:
```tsx
{(doctor.qualifications ?? []).map((qualification) => (
  <div key={`${qualification.degree}-${qualification.institution}-${qualification.year}`}>
    ...
  </div>
))}

{(doctor.qualifications ?? []).length === 0 && (
  <p>No qualifications added yet.</p>
)}
```
The UI handles both "data exists" and "empty list" states explicitly.

## Backend Code
There is no direct backend call in `ViewDoctorDetailDialog.tsx`. It only consumes already-available `DoctorListDto` data from parent state.

The DTO shape used by this dialog comes from generated OpenAPI client types in:
- `frontend/src/api/model/DoctorListDto.ts`

That file indicates several optional/nullable fields (like `consultationFee`, `phoneNumber`, `bio`, `address`) which explains why this component has many fallback formatters.

## End-to-End Code Flow
1. Admin user opens doctor list page.
2. Page logic selects one doctor row and sets `selectedDoctor` + opens details dialog.
3. `ViewDoctorDetailDialog` receives that `DoctorListDto` object as props.
4. Component formats values to avoid showing blank/unsafe raw values.
5. User navigates tabs to review different parts of the doctor's profile.
6. User closes dialog; parent state updates through `onOpenChange`.

## Important Details
- This is a **read-only** component; it uses `readOnly` inputs/textareas intentionally for visual consistency with form controls.
- It uses helper subcomponents (`ReadOnlyField`, `ReadOnlyTextarea`) to reduce repeated field markup and keep styling consistent.
- It protects UI quality by handling invalid date values and non-numeric consultation fee values gracefully instead of crashing.
- It shows sensitive fields like IC number in read-only mode, so parent-level access control still matters at the page/route level.

## Beginner Programmer Notes
- A **DTO** (Data Transfer Object) is the typed data shape sent from backend to frontend. Here, `DoctorListDto` defines what the UI can read.
- A component like this is called **presentational** because it mainly renders data and does not own business actions like fetching/saving.
- `onOpenChange` is a common React pattern for controlled dialogs: parent stores state, child emits changes.
- `?? []` means “if null/undefined, use empty array,” which prevents runtime errors when mapping list data.
