# View Patient Detail Dialog (Plain-English Explanation)

## Short Version
This dialog shows a full patient profile when an admin clicks “view” on a patient in the admin patient list. It opens as a popup and displays personal information, allergies, and emergency contact details in a readable layout. If some data is missing, it shows safe fallback text like “N/A” or “No known allergies.”

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx` | Main component that renders the patient detail popup and helper formatting logic. |
| `frontend/src/features/admins/AdminPatientsPage.tsx` | Shows where this dialog is opened and how the selected patient is passed into it. |

## What Happens
1. The parent page keeps track of which patient is currently selected.
2. When the user clicks “view” from the patient table, the parent stores that patient in state and opens the dialog.
3. The dialog receives three props:
   - `patient`: the selected patient object (or `null`)
   - `open`: whether the dialog should be visible
   - `onOpenChange`: callback to close/open the dialog
4. If `patient` is `null`, the dialog renders nothing.
5. If `patient` exists, it shows:
   - Name and initials avatar
   - Blood group badge (if available)
   - Gender and phone summary
   - Personal information section (DOB, IC number, blood group, etc.)
   - Allergy cards with color-coded severity
   - Emergency contact card (or fallback message)

## Important Code Snippets
From `frontend/src/features/admins/AdminPatientsPage.tsx`:
```tsx
const handleViewPatient = (patient: ClinicStaffPatientDto) => {
  setSelectedPatient(patient);
  setViewPatientOpen(true);
};
```
This is the trigger: once a patient is selected, the popup is opened.

From `frontend/src/features/admins/AdminPatientsPage.tsx`:
```tsx
<ViewPatientDetailDialog
  patient={selectedPatient}
  open={viewPatientOpen}
  onOpenChange={setViewPatientOpen}
/>
```
This connects parent state to the dialog component.

From `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx`:
```tsx
if (!patient) {
  return null;
}
```
Safety guard: the UI only renders when a real patient exists.

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
This turns API date values into a user-friendly day-month-year format and avoids showing broken dates.

From `frontend/src/features/admins/managePatients/ViewPatientDetailDialog.tsx`:
```tsx
const SEVERITY_STYLES: Record<string, { icon: string; badge: string }> = {
  high: { ... },
  low: { ... },
  mild: { ... },
  moderate: { ... },
  severe: { ... },
};
```
This decides allergy colors/badges so high/severe allergies visually stand out.

## Code Flow
1. Admin is on **Manage Patients** page.
2. Admin clicks a “view patient” action in the table.
3. `handleViewPatient` stores the selected patient and opens the dialog.
4. `ViewPatientDetailDialog` receives the selected patient via props.
5. Dialog formats labels (gender/date/initials), then renders sections.
6. Missing values are replaced by fallback text to keep the UI stable.
7. Closing the dialog updates `open` state through `onOpenChange`.

## Important Details
- **No extra API call in this dialog itself:** it only displays the patient object passed by the parent.
- **Defensive UI behavior:** if date parsing fails, it shows `N/A`; if allergies are empty, it shows “No known allergies”; if emergency contact is missing, it shows a clear fallback message.
- **Reusable row pattern:** `DetailRow` keeps personal info display consistent.
- **Visual risk signaling:** allergy severity styling helps users quickly notice higher-risk allergies.

## In Everyday Words
This is a “patient profile popup.” The table page chooses which patient to show, and this component presents that person’s details in a clear, safe format, including fallbacks when information is missing.
