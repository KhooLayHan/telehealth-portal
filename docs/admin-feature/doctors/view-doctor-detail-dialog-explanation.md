# View Doctor Detail Dialog (Plain English)

## Short Version
This dialog shows a full read-only profile for one doctor when an admin clicks “View Details.”
It receives the selected doctor object from the parent page, splits the information into tabs, and formats empty values consistently as “Not provided.”
It does not call the backend directly; it only displays data that has already been loaded.

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx` | The component that renders the doctor detail popup UI and formatting helpers. |
| `frontend/src/features/admins/AdminDoctorsPage.tsx` | The page that selects a doctor and opens this dialog when “View Details” is clicked. |

## What Happens
When an admin chooses **View Details** on a doctor card, the admin page finds that doctor in the loaded list and stores it in `selectedDoctor`. It then opens the detail dialog.

Inside the dialog component:
- If there is no doctor object, it renders nothing.
- It calculates initials from first and last name for a circle avatar.
- It shows the doctor’s profile in 4 tabs: **Personal**, **Professional**, **Address**, and **Qualifications**.
- Every value is read-only and styled like form fields.
- Missing values become `Not provided`, so the UI stays consistent.
- Dates and fees are formatted for users (date in `en-GB`, currency in Malaysian Ringgit).

## Important Code Snippets
From `frontend/src/features/admins/AdminDoctorsPage.tsx`:

```tsx
onViewDetails={(id) => {
  const d = doctors.find((x) => String(x.doctorPublicId) === id);
  if (d) {
    setSelectedDoctor(d);
    setDetailsOpen(true);
  }
}}
```

This is the trigger. The page picks the doctor by ID and opens the dialog.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:

```tsx
if (!doctor) return null;
```

This is a guard. The dialog only renders if a doctor object exists.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:

```tsx
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return notProvided;
  }

  return String(value);
}
```

This ensures all empty values are shown as `Not provided` instead of blank fields.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:

```tsx
<TabsTrigger value="personal">Personal</TabsTrigger>
<TabsTrigger value="professional">Professional</TabsTrigger>
<TabsTrigger value="address">Address</TabsTrigger>
<TabsTrigger value="qualifications">Qualifications</TabsTrigger>
```

These define the 4 sections to make large profile data easier to read.

From `frontend/src/features/admins/manageDoctors/ViewDoctorDetailDialog.tsx`:

```tsx
{(doctor.qualifications ?? []).length === 0 && (
  <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-muted-foreground text-sm">
    No qualifications added yet.
  </p>
)}
```

This gives a clear fallback message when qualification records are missing.

## Code Flow
1. Admin clicks **View Details** on a doctor card.
2. `AdminDoctorsPage` finds the matching `DoctorListDto` and sets `selectedDoctor`.
3. `AdminDoctorsPage` sets `detailsOpen = true`.
4. `ViewDoctorDetailDialog` receives `doctor`, `open`, and `onOpenChange` props.
5. Dialog renders read-only sections/tabs with formatted values.
6. Admin closes dialog using the **Close** button, which calls `onOpenChange(false)`.

## Important Details
- This component is display-only; no save/update action is performed.
- It uses reusable `ReadOnlyField` and `ReadOnlyTextarea` wrappers so visual style matches the rest of doctor forms.
- It handles invalid date/currency values safely by falling back to string output instead of crashing.
- The IC number is shown as read-only text; this file does not log it or send it elsewhere.

## In Everyday Words
This is a “doctor profile viewer” popup for admins. It opens with the selected doctor, organizes all details into simple tabs, and shows clean fallback text when information is missing.
