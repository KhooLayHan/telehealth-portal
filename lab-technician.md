# Lab Technician Feature — Full Reference Guide

> For presentation use. Covers every lab technician feature end-to-end: Route → Frontend → API Client → Backend Endpoint → Handler → Database. AWS S3 direct upload and MassTransit → SNS → SQS → Lambda pipeline are included.

---

## Writing Style Guide (for future reference)

Each feature section follows this pattern:
- **Step number + plain English title** — one sentence saying what the user sees or what happens
- **File link with exact line numbers** — clickable, format: `[path/to/File.tsx:line](path/to/File.tsx#Lline)`
- **Code snippet** — only the relevant lines, not the whole file
- **Line-by-line explanation** — each important line explained in plain English, no jargon without definition
- **Human analogy** — one sentence comparing it to something real ("Think of it like a reception desk...")
- **Summary arrow chain** — `FileA:line → does X → FileB:line → does Y`

---

## Architecture Overview

```
Browser (React)
  └── Route file (TanStack Router)
        └── Feature Component  ←→  Hook (logic + state)
                                         └── Generated API Client (orval)
                                                └── Backend Endpoint (Minimal API)
                                                       └── Handler (business logic)
                                                              └── ApplicationDbContext (EF Core)
                                                                     └── PostgreSQL (Neon Dev / RDS Prod)
                                                              [S3 Presigned URL (direct browser upload)]
                                                       [MassTransit → SNS → SQS → Lambda (lab-pdf-processor)]
```

**Tech stack:**
- **Frontend:** React 19 + TypeScript, TanStack Router, TanStack Query, shadcn/ui, Zustand
- **Backend:** ASP.NET Core (.NET 10), Minimal API, EF Core, NodaTime, MassTransit (SNS publisher)
- **Storage:** AWS S3 (lab report PDFs — presigned PUT/GET URLs)
- **DB:** PostgreSQL
- **Messaging:** AWS SNS + SQS + Lambda (lab report processing pipeline)

---

## Feature 0 — Login → Lab Tech Dashboard

**What the user sees:** Lab technician types email + password → clicks Login → lands on the lab tech dashboard with their name in the greeting and their avatar in the sidebar.

The login flow itself is identical to every other role. See `doctor.md` Feature 0 for the full chain: form submit → `POST /auth/login` → JWT cookie → `getMe()` → Zustand auth store → `navigate("/dashboard")`. The only difference is the `role` field inside the JWT and the auth store, which reads `"lab-tech"`.

---

### Step 1 — Dashboard reads the role and renders the lab tech view

**File:** [frontend/src/features/dashboard/Dashboard.tsx:14-28](frontend/src/features/dashboard/Dashboard.tsx#L14-L28)

```tsx
switch (user?.role?.toLowerCase()) {
  case "patient":       return <PatientDashboard />;
  case "receptionist":  return <ReceptionistDashboard />;
  case "doctor":        return <DoctorDashboard />;
  case "admin":         return <AdminDashboard />;
  case "lab-tech":      return <LabTechDashboard />;
  default:              return <div>Invalid Role Detected</div>;
}
```

The dashboard is the same `/dashboard` URL for every role. The auth store (set during login) holds `user.role`, and this `switch` picks the correct component. The greeting at [Dashboard.tsx:37-43](frontend/src/features/dashboard/Dashboard.tsx#L37-L43) uses `user.firstName` from the same store.

---

### Step 2 — Lab Tech Dashboard loads

**File:** [frontend/src/features/dashboard/roles/LabTechnicianDashboard.tsx:276-332](frontend/src/features/dashboard/roles/LabTechnicianDashboard.tsx#L276-L332)

| Line | What it does |
|------|-------------|
| 277–280 | Calls `useGetAllLabReports({ Status: "pending", PageSize: 1 })` — asks the backend for only 1 pending record so it can read `totalCount` from the response headers |
| 281 | `pendingCount` — extracts `totalCount` from the response. This powers the "Pending Lab Requests" stat card |
| 284–319 | Renders 3 stat cards in a responsive grid: Pending (amber icon), Processed Today (green icon — hardcoded 18), Equipment Status (hardcoded "Online") |
| 321–329 | Renders `<LabOrdersTable>` — an inline table of recent reports with search, status pills, and an Upload action |

---

### Step 3 — Inline Lab Orders Table

**File:** [frontend/src/features/dashboard/roles/LabTechnicianDashboard.tsx:109-275](frontend/src/features/dashboard/roles/LabTechnicianDashboard.tsx#L109-L275)

```tsx
const columns: ColumnDef<LabReportDto>[] = [
  { accessorKey: "patientFullName", header: "Patient", ... },
  { accessorKey: "reportType",    header: "Report Type", ... },
  { id: "status", header: "Status", cell: ({ row }) => {
      const { name, colorCode } = row.original.status;
      return <span style={{ borderColor: colorCode, color: colorCode, backgroundColor: `${colorCode}12` }}>{name}</span>;
  }},
  { accessorKey: "createdAt", header: "Created", ... },
  { id: "actions", header: "Actions", cell: ({ row }) => {
      const isPending = row.original.status.slug === "pending";
      if (!isPending) return <span>—</span>;
      return <Link to="/lab-reports">Upload</Link>;
  }},
];
```

| Line | What it does |
|------|-------------|
| 28–33 | `LAB_STATUSES` — local constant array of the 4 possible status slugs (`pending`, `processing`, `completed`, `rejected`) with their display names and hex colour codes |
| 46–108 | Column definitions using TanStack Table. Status cell renders a coloured outline pill with a dot (same visual pattern as the doctor appointments page). Actions cell only renders an "Upload" link when `slug === "pending"` |
| 110 | `LabOrdersTable()` — the inner component |
| 113–116 | Debounced search: `useEffect` with `setTimeout(..., 500)` — waits 500ms after the user stops typing before updating `debouncedSearch`, which is what actually gets sent to the API |
| 117–122 | `useGetAllLabReports({ Search, Status, PageSize: 5, SortOrder: "desc" })` — fetches the 5 most recent reports |
| 124–128 | `useReactTable` with `getCoreRowModel` — basic table setup, no pagination controls inside the table (dashboard shows a fixed 5 rows) |
| 143–210 | Filter bar: search input with a clear-X button + status filter pills (All, Pending Upload, Processing, Completed, Rejected) + a Clear button that appears only when filters are active |
| 265–271 | Footer link: "View all lab reports" → navigates to `/lab-reports` |

Think of the dashboard like a lab bench whiteboard — the top cards show how many samples are waiting, and the table shows the most recent orders so the technician can immediately pick one to process.

---

### Full chain — Feature 0

```
Dashboard.tsx:14-28            → reads user.role === "lab-tech" → renders <LabTechDashboard />
LabTechnicianDashboard.tsx:277 → useGetAllLabReports({ Status: "pending", PageSize: 1 })
LabTechnicianDashboard.tsx:281 → extracts totalCount → "Pending Lab Requests" stat card
LabTechnicianDashboard.tsx:117 → useGetAllLabReports({ Search, Status, PageSize: 5, SortOrder: "desc" })
LabTechnicianDashboard.tsx:46  → column defs: status pill + conditional Upload link
LabTechnicianDashboard.tsx:113 → debounced search (500ms)
LabTechnicianDashboard.tsx:99  → Upload link → navigate to /lab-reports
LabTechnicianDashboard.tsx:265 → "View all lab reports" footer link → /lab-reports
```

---

## Feature 1 — Lab Reports Page

**What the user sees:** A full-page lab reports manager with 4 tabs (All, Pending, Completed, Upload New). The first three tabs show stat cards and a searchable table with Previous/Next pagination. The "Upload New" tab shows a patient search picker — type a name, select a patient, see their report history, and either view an old PDF or start a new upload wizard.

### Step-by-step flow

```
Route (/lab-reports) → LabReportsPage → LabTechLabReportsPage
  ├── useGetAllLabReports          → GET /api/v1/lab-reports
  ├── useGetAllPatientsForClinicStaff → GET /api/v1/patients/staff
  ├── PatientLabReportsView         → per-patient history
  └── LabReportUploadWizard         → 3-step upload flow
```

---

### Step 1 — Route

**File:** [frontend/src/routes/_protected/lab-reports_.tsx:4-5](frontend/src/routes/_protected/lab-reports_.tsx#L4-L5)

```tsx
export const Route = createFileRoute("/_protected/lab-reports_")({
  component: LabReportsPage,
});
```

The `/_protected` layout means the user must be logged in. TanStack Router handles the auth guard before this route ever renders.

---

### Step 2 — Role dispatch

**File:** [frontend/src/features/lab-reports/LabReportsPage.tsx:4-16](frontend/src/features/lab-reports/LabReportsPage.tsx#L4-L16)

```tsx
export function LabReportsPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  switch (role) {
    case "lab-tech": return <LabTechLabReportsPage />;
    default:         return <div>Invalid Role Detected</div>;
  }
}
```

Same pattern as the dashboard — one URL, one wrapper, different content per role. The backend never decides which page renders.

---

### Step 3 — Tabs and state setup

**File:** [frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx:19-46](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L19-L46)

```tsx
const tabs = [
  { value: "all",       label: "All Reports" },
  { value: "pending",   label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "upload",    label: "Upload New" },
];
```

| Line | What it does |
|------|-------------|
| 19 | `TabValue` union type: `"all" | "pending" | "completed" | "upload"` |
| 21–26 | Tab config array — rendered as a horizontal nav with an active underline |
| 29 | `activeTab` state — starts on `"all"` |
| 38–39 | `statusFilter` derived from `activeTab`: "pending" tab → `"pending"`, "completed" tab → `"completed"`, otherwise `undefined` |
| 40–46 | `useGetAllLabReports({ Search, Status, Page, PageSize: 10, SortOrder: "desc" })` — the main reports query. `REPORT_PAGE_SIZE` is 10 |

---

### Step 4 — Stats cards (Pending / Completed / Total)

**File:** [frontend/src/features/lab-reports/components/LabReportsStats.tsx:9-45](frontend/src/features/lab-reports/components/LabReportsStats.tsx#L9-L45)

| Card | Icon | Colour | Count source |
|------|------|--------|--------------|
| Pending Reports | ClipboardList | Amber (`bg-amber-100`) | `pendingCount` — `allReports.filter(r => r.status.slug === "pending")` |
| Completed Today | FileCheck | Green (`bg-green-100`) | `completedCount` — `allReports.filter(r => r.status.slug === "completed")` |
| Total Reports | FileText | Blue (`bg-blue-100`) | `totalCount` — `reportsResult.totalCount` from the server |

These counts are computed in `useMemo` at [LabTechLabReportsPage.tsx:56-64](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L56-L64) so they only re-calculate when the report data changes.

---

### Step 5 — Reports table with search and pagination

**File:** [frontend/src/features/lab-reports/components/LabReportsTable.tsx:19-138](frontend/src/features/lab-reports/components/LabReportsTable.tsx#L19-L138)

| Line | What it does |
|------|-------------|
| 19–28 | `getStatusColor(slug)` — maps `"pending"` → amber badge, `"completed"` → green badge, everything else → grey |
| 44–60 | Search input with magnifying glass icon and `onSearchChange` callback |
| 63–69 | 3 states: loading skeleton → empty state with dashed border + message → table rows |
| 76–80 | Table header: Patient, Report Type, Status, Date, Action |
| 86 | Patient name cell: `font-medium` |
| 88–91 | Status cell: `<Badge variant="outline" className={getStatusColor(...)}>` |
| 93–97 | Date cell: `new Date(String(createdAt)).toLocaleDateString()` |
| 99–107 | Action cell: "View PDF" button with `<Eye>` icon — calls `onViewReport(report)` |
| 115–138 | Pagination: Previous/Next buttons, page counter, hidden when `totalPages <= 1` |

Think of the table like a filing cabinet drawer — each row is a folder, the status badge is a colour-coded tab, and the View PDF button opens the folder.

---

### Step 6 — "View PDF" opens a presigned S3 URL

**File:** [frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx:112-124](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L112-L124)

```ts
const handleViewReport = async (report: LabReportDto) => {
  const response = await getBySlug(report.slug);
  if (response.status === 200) {
    const url = response.data.downloadUrl;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }
};
```

`getBySlug` is an orval-generated function (not a hook) that sends `GET /api/v1/lab-reports/{slug}/download`. The backend returns a presigned S3 GET URL, and the browser opens it directly in a new tab. The PDF bytes never flow through the frontend build — the browser talks straight to S3.

---

### Step 7 — "Upload New" tab: patient picker

**File:** [frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx:196-289](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L196-L289)

When the technician clicks the "Upload New" tab, the page switches to patient search mode:

| Line | What it does |
|------|-------------|
| 77–81 | `useGetAllPatientsForClinicStaff({ Search, Page, PageSize: 15 })` — searches patients by name (`GET /api/v1/patients/staff`) |
| 199–224 | Search input with clear button — typing calls `handlePatientSearchChange` which resets page to 1 and clears any previously selected patient |
| 226–231 | 3 states: loading → "No patients found" / "Type a name to search patients" → results grid |
| 235–265 | Patient cards: avatar circle with `<User>` icon, full name, gender, blood group. Each card has a "Select" button |
| 267–287 | Pagination for patients: Previous/Next, page X of Y |

Think of this like looking up a patient file in the clinic registry before you can attach a new lab result to them.

---

### Step 8 — Selecting a patient shows their report history

**File:** [frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx:141-163](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L141-L163)

```tsx
if (selectedPatientId && selectedPatient) {
  if (showWizard) {
    return <LabReportUploadWizard patientPublicId={selectedPatientId} ... />;
  }
  return (
    <PatientLabReportsView
      patient={selectedPatient}
      reports={patientReports}
      onBack={handleBackToList}
      onUploadNew={handleUploadNew}
      onViewReport={handleViewReport}
    />
  );
}
```

| Line | What it does |
|------|-------------|
| 67–71 | `useGetAllLabReports({ PatientPublicId: selectedPatientId, PageSize: 15, SortOrder: "desc" })` — fetches this patient's lab report history |
| 89–91 | `selectedPatient` — found from the current `patients` array by matching `patientPublicId` |
| 126–129 | `handleSelectPatient` — sets `selectedPatientId` and closes the wizard |
| 131–133 | `handleUploadNew` — sets `showWizard = true` |

---

### Step 9 — PatientLabReportsView layout

**File:** [frontend/src/features/lab-reports/components/PatientLabReportsView.tsx:27-134](frontend/src/features/lab-reports/components/PatientLabReportsView.tsx#L27-L134)

| Line | What it does |
|------|-------------|
| 34–35 | Computes `pendingCount` and `completedCount` from the `reports` array for small stat cards |
| 45–75 | Patient details card: large avatar, full name, gender, blood group, allergies summary (amber text) |
| 69–72 | "Upload New Report" button — triggers `onUploadNew()` which opens the wizard |
| 78–87 | Two stat pills: Pending Reports (amber) and Completed Reports (green) |
| 92–100 | Empty state: dashed border box with "No lab reports yet" + "Upload First Report" button |
| 103–130 | Report history list: each row is a card showing report type, date, status badge, and a View button |

---

### Full chain — Feature 1

```
lab-reports_.tsx:4-5            → Route /lab-reports → renders LabReportsPage
LabReportsPage.tsx:8             → role === "lab-tech" → renders <LabTechLabReportsPage />
LabTechLabReportsPage.tsx:19    → TabValue type + tabs array
LabTechLabReportsPage.tsx:29    → activeTab state ("all" | "pending" | "completed" | "upload")
LabTechLabReportsPage.tsx:38-39 → statusFilter derived from activeTab
LabTechLabReportsPage.tsx:40    → useGetAllLabReports({ Search, Status, Page, PageSize: 10 })
                                 → GET /api/v1/lab-reports
LabTechLabReportsPage.tsx:56    → useMemo → pendingCount / completedCount / totalCount
LabReportsStats.tsx:16          → Pending card (amber)
LabReportsStats.tsx:26          → Completed card (green)
LabReportsStats.tsx:36          → Total card (blue)
LabReportsTable.tsx:19          → getStatusColor → amber/grey/green badges
LabReportsTable.tsx:99          → View PDF button → onViewReport(report)
LabTechLabReportsPage.tsx:112   → getBySlug(report.slug) → GET /api/v1/lab-reports/{slug}/download
LabTechLabReportsPage.tsx:118   → window.open(response.data.downloadUrl)
LabTechLabReportsPage.tsx:196   → activeTab === "upload" → patient search UI
LabTechLabReportsPage.tsx:77    → useGetAllPatientsForClinicStaff({ Search, Page, PageSize: 15 })
                                 → GET /api/v1/patients/staff
LabTechLabReportsPage.tsx:235   → patient cards rendered with name, gender, blood group
LabTechLabReportsPage.tsx:257   → Select button → handleSelectPatient → selectedPatientId set
LabTechLabReportsPage.tsx:67    → useGetAllLabReports({ PatientPublicId, PageSize: 15 })
                                 → GET /api/v1/lab-reports (patient-scoped)
PatientLabReportsView.tsx:69    → Upload New Report button → onUploadNew → wizard opens
LabTechLabReportsPage.tsx:143   → showWizard → <LabReportUploadWizard />
```

---

## Feature 2 — Upload Wizard: Step 1 (Initialize + S3 PDF Upload)

**What the user sees:** A 2-step wizard (Step 1/2 shown in a progress bar). Step 1 asks for a Report Type dropdown and a drag-and-drop PDF zone. The technician drops a PDF, sees a file preview, clicks Upload, and the file goes straight to Amazon S3 — not through our servers. A green success indicator appears, and the wizard auto-advances to Step 2.

This is the most technically interesting feature in the lab module because the PDF bytes never touch the backend API server.

### Step-by-step flow

```
LabReportUploadWizard → useWizard (state machine)
  └── Step 1: UploadStep
        ├── ReportTypeSelector (dropdown)
        └── S3PdfDropzone
              ├── useS3FileUpload (hook)
              │     ├── createReportMutation  → POST /api/v1/lab-reports/initialize
              │     └── fetch(uploadUrl, PUT, file) → DIRECT to AWS S3
              └── onUploadComplete(slug) → wizard advances to Step 2
```

---

### Step 1 — Wizard shell and state machine

**File:** [frontend/src/features/lab-reports/LabReportUploadWizard.tsx:11-50](frontend/src/features/lab-reports/LabReportUploadWizard.tsx#L11-L50)

```tsx
export function LabReportUploadWizard({ patientPublicId, consultationPublicId }) {
  const { step, labReportSlug, reportType, setReportType, handlePdfUploaded, ... } = useWizard();

  if (step === 3) return <SuccessScreen reportType={reportType} onReset={handleReset} />;

  return (
    <div className="max-w-3xl mx-auto py-4">
      <WizardProgress currentStep={step} totalSteps={2} />
      <Card className="shadow-lg">
        {step === 1 && <UploadStep ... onUploadComplete={handlePdfUploaded} />}
        {step === 2 && labReportSlug !== null && <BiomarkersStep ... />}
      </Card>
    </div>
  );
}
```

| Line | What it does |
|------|-------------|
| 15–24 | `useWizard()` returns a tiny state machine: `step` (1, 2, or 3), `labReportSlug`, `reportType`, and transition functions |
| 26 | If `step === 3` → renders the success screen instead of the wizard |
| 32 | `WizardProgress` shows "Step 1/2" or "Step 2/2" as a visual progress bar |
| 35–42 | Step 1 renders `UploadStep` — passes `onUploadComplete={handlePdfUploaded}` |
| 45–47 | Step 2 renders `BiomarkersStep` — only if `labReportSlug` is not null |

**File:** [frontend/src/features/lab-reports/hooks/useWizard.ts:4-37](frontend/src/features/lab-reports/hooks/useWizard.ts#L4-L37)

```ts
export function useWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [labReportSlug, setLabReportSlug] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("Full Blood Count");

  const handlePdfUploaded = (slug: string) => { setLabReportSlug(slug); setStep(2); };
  const handleReset = () => { setStep(1); setLabReportSlug(null); setReportType("Full Blood Count"); };
  const handleSuccess = () => { setStep(3); };
  const goBack = () => { setStep(1); };
```

| Function | Trigger | Result |
|----------|---------|--------|
| `handlePdfUploaded(slug)` | S3 upload succeeds | Saves slug, advances to Step 2 |
| `handleSuccess()` | Biomarkers form submits successfully | Advances to Step 3 (success screen) |
| `handleReset()` | Click "Upload Another" on success screen | Returns to Step 1, clears slug and report type |
| `goBack()` | Click "Back" on Step 2 | Returns to Step 1 |

---

### Step 2 — Report Type selector

**File:** [frontend/src/features/lab-reports/components/ReportTypeSelector.tsx:9-32](frontend/src/features/lab-reports/components/ReportTypeSelector.tsx#L9-L32)

```tsx
const REPORT_TYPES = [
  "Full Blood Count", "Liver Function Test", "Kidney Function Test",
  "Lipid Panel", "Thyroid Function Test", "HbA1c", "Urinalysis", "Other",
] as const;
```

| Line | What it does |
|------|-------------|
| 9 | `REPORT_TYPES` — hardcoded local constant. These are the only options in the dropdown. `"Other"` is the catch-all |
| 21 | `<Select value={value} onValueChange={...}>` — shadcn/ui select component |
| 26–30 | Maps `REPORT_TYPES` into `<SelectItem>` options |

The selected report type is stored in the wizard state and later sent to the backend during initialization so the slug can include a human-readable prefix.

---

### Step 3 — S3 PDF Dropzone UI

**File:** [frontend/src/features/lab-reports/dropzone/S3PdfDropzone.tsx:12-72](frontend/src/features/lab-reports/dropzone/S3PdfDropzone.tsx#L12-L72)

```tsx
export function S3PdfDropzone(props: S3PdfDropzoneProps) {
  const { file, uploadState, errorMessage, isUploading, handleUpload, handleRemoveFile, validateAndSetFile } = useS3FileUpload(props);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); }, []);
  const handleDrop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragActive(false); validateAndSetFile(e.dataTransfer.files[0]); }, [validateAndSetFile]);
```

| Line | What it does |
|------|-------------|
| 21 | `useS3FileUpload(props)` — the core logic hook. Returns `file`, `uploadState`, `handleUpload`, etc. |
| 23 | `isDragActive` — local UI state that changes the dropzone border colour when a file is dragged over the browser window |
| 25–29 | `handleDragOver` — `preventDefault` is required so the browser doesn't open the PDF file as a new page |
| 37–45 | `handleDrop` — reads `e.dataTransfer.files[0]` and passes it to `validateAndSetFile` |
| 47–49 | If `uploadState === "success"` → renders `<UploadStatus>` (green checkmark) instead of the dropzone |
| 53–61 | No file yet → renders `<FileDropZone>` (the dashed border box with instructions) |
| 63 | File selected → renders `<FilePreview>` (file name + size + remove button) |
| 66 | Error state → renders `<ErrorAlert>` |
| 68–70 | File exists and not yet uploaded → renders `<UploadButton>` |

---

### Step 4 — File validation (PDF only, max 10 MB)

**File:** [frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts:18-36](frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts#L18-L36)

```ts
const validateAndSetFile = useCallback((candidate: File | null | undefined) => {
  if (!candidate) return;
  if (candidate.type !== ACCEPTED_MIME) {
    setUploadState("error");
    setErrorMessage("Only PDF files are accepted.");
    return;
  }
  if (candidate.size > MAX_FILE_SIZE_BYTES) {
    setUploadState("error");
    setErrorMessage("File exceeds the 10 MB limit.");
    return;
  }
  setFile(candidate);
  setUploadState("idle");
  setErrorMessage(null);
}, []);
```

**Constants:** [frontend/src/features/lab-reports/dropzone/constants.ts:1-2](frontend/src/features/lab-reports/dropzone/constants.ts#L1-L2)

```ts
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const ACCEPTED_MIME = "application/pdf";
```

The validation happens entirely in the browser — no network call until the user clicks Upload.

---

### Step 5 — The S3 upload sequence (the key technical flow)

**File:** [frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts:38-91](frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts#L38-L91)

```ts
async function handleUpload() {
  if (!file) return;
  setUploadState("getting_link");

  const apiResponse = await createReportMutation.mutateAsync({
    data: {
      patientPublicId,
      consultationPublicId: consultationPublicId ?? null,
      reportType,
      fileName: file.name,
      contentType: file.type,
    },
  });

  if (apiResponse.status !== 201) throw new Error("Failed to initialize lab report record.");
  const { slug, uploadUrl } = apiResponse.data;
  if (!uploadUrl) throw new Error("Failed to generate secure upload link.");

  setUploadState("uploading");
  const s3Response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });
  if (!s3Response.ok) throw new Error(`S3 upload failed (HTTP ${s3Response.status}).`);

  setUploadState("success");
  onUploadComplete(slug);
}
```

| Step | Action | Network request | Who touches the file bytes? |
|------|--------|-----------------|------------------------------|
| ① | Call backend to "initialize" the report | `POST /api/v1/lab-reports/initialize` | Backend only creates a DB row and a presigned URL. **Never sees the file.** |
| ② | Upload directly to S3 | `fetch(uploadUrl, { method: "PUT", body: file })` | Browser sends PDF bytes **straight to AWS S3**. Backend API server is not involved. |
| ③ | Notify wizard on success | `onUploadComplete(slug)` (local JS callback) | No network call. Wizard advances to Step 2. |

Think of it like a one-time postage label: you ask the backend to prepare a labelled envelope (presigned URL), then you drop the letter directly into the postbox (S3). The backend never opens the envelope.

---

### Step 6 — Backend initializes the report record and creates the presigned URL

**File:** [backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportHandler.cs:14-59](backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportHandler.cs#L14-L59)

| Line | What it does |
|------|-------------|
| 23–31 | Looks up patient by `PatientPublicId`. If missing → throws `PatientNotFoundException` (logs generic warning with PublicId only, no PII) |
| 33–34 | Generates a UUID and a slug: `lab-{reportType}-{uuid[:8]}` — human-readable and unique |
| 37–38 | Builds the S3 object key: `lab-reports/{yyyy/MM}/patient-{patient.PublicId}/{uuid}.ext` — organised by month and patient |
| 40–49 | Creates the `LabReport` entity in memory: `StatusId = Pending` (StatusId = 1), stores `ReportType`, `FileName`, `S3ObjectKey` |
| 51 | Calls `IS3Service.GeneratePreSignedUploadUrl(s3ObjectKey, contentType)` — AWS SDK generates a PUT URL valid for 15 minutes |
| 53–54 | Adds the entity to EF Core's change tracker and saves to PostgreSQL. The record exists now, but the PDF is not yet uploaded |
| 58 | Returns `{ PublicId, Slug, UploadUrl }` to the frontend |

**Endpoint:** [backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportEndpoint.cs:12-33](backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportEndpoint.cs#L12-L33)

| Line | What it does |
|------|-------------|
| 12 | `MapPost` — `POST /api/v1/lab-reports/initialize` |
| 29 | `.RequireAuthorization(AuthConstants.LabTechPolicy)` — only lab technicians can initialize a report |
| 33 | `.AddEndpointFilter<ValidationFilter<InitializeLabReportCommand>>()` — runs FluentValidation on the incoming command before the handler |

---

### Step 7 — Upload state machine

**File:** [frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts:13](frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts#L13)

```ts
const [uploadState, setUploadState] = useState<UploadState>("idle");
```

`UploadState` type: `"idle" → "getting_link" → "uploading" → "success" | "error"`

| State | UI shows |
|-------|----------|
| `idle` | Dropzone or file preview + Upload button |
| `getting_link` | Upload button disabled, spinner |
| `uploading` | Upload button disabled, spinner |
| `success` | `<UploadStatus>` green checkmark. Wizard auto-advances to Step 2 |
| `error` | `<ErrorAlert>` with the message |

`isUploading` boolean at [line 100](frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts#L100) is `true` for both `"getting_link"` and `"uploading"`.

---

### Full chain — Feature 2

```
LabReportUploadWizard.tsx:15   → useWizard() → step state machine
LabReportUploadWizard.tsx:32   → WizardProgress currentStep={step} totalSteps={2}
LabReportUploadWizard.tsx:35   → step === 1 → renders <UploadStep />
UploadStep.tsx:30              → ReportTypeSelector → REPORT_TYPES dropdown
UploadStep.tsx:31              → S3PdfDropzone → drag-and-drop zone
S3PdfDropzone.tsx:21           → useS3FileUpload(props)
constants.ts:1                 → MAX_FILE_SIZE_BYTES = 10 MB
constants.ts:2                 → ACCEPTED_MIME = "application/pdf"
useS3FileUpload.ts:18          → validateAndSetFile → rejects non-PDF or oversized files
useS3FileUpload.ts:42          → setUploadState("getting_link")
useS3FileUpload.ts:44          → createReportMutation.mutateAsync({ data: { patientPublicId, reportType, fileName, contentType } })
                                 → POST /api/v1/lab-reports/initialize
InitializeLabReportEndpoint.cs:12 → MapPost /initialize
InitializeLabReportHandler.cs:23 → looks up patient by PatientPublicId
InitializeLabReportHandler.cs:34 → generates slug: lab-{reportType}-{uuid[:8]}
InitializeLabReportHandler.cs:37 → S3 key: lab-reports/{yyyy/MM}/patient-{PublicId}/{uuid}.ext
InitializeLabReportHandler.cs:45 → StatusId = Pending
InitializeLabReportHandler.cs:51 → GeneratePreSignedUploadUrl (PUT, 15 min expiry)
InitializeLabReportHandler.cs:54 → db.SaveChangesAsync() → inserts LabReport row
useS3FileUpload.ts:58          → receives { slug, uploadUrl }
useS3FileUpload.ts:64          → setUploadState("uploading")
useS3FileUpload.ts:66          → fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } })
                                 → PDF bytes go DIRECTLY to AWS S3 (backend never sees them)
useS3FileUpload.ts:76          → setUploadState("success")
useS3FileUpload.ts:77          → onUploadComplete(slug) → handlePdfUploaded → setStep(2)
useWizard.ts:9                 → handlePdfUploaded → setLabReportSlug(slug), setStep(2)
LabReportUploadWizard.tsx:45   → step === 2 → renders <BiomarkersStep labReportSlug={slug} />
```

---

## Feature 3 — Upload Wizard: Step 2 (Biomarkers + Complete)

**What the user sees:** Step 2 is titled "Extract Biomarkers". An "Add Biomarker" button adds rows dynamically. Each row has 5 inline fields: Name (e.g. "Hemoglobin"), Value (e.g. "13.5"), Unit (e.g. "g/dL"), Reference Range (e.g. "12.0-16.0"), and a Flag dropdown (normal / high / low). A Zod schema blocks empty fields. At the bottom are "Back" and "Publish & Notify Patient" buttons. Clicking Publish sends the biomarkers to the backend, which marks the report Completed, stores the biomarkers as JSONB, sets the uploaded timestamp, publishes a `LabReportCompletedEvent` to MassTransit (→ SNS → SQS → Lambda), and returns `204 No Content`. The wizard then shows the Success Screen.

---

### Step 1 — BiomarkersStep renders the form

**File:** [frontend/src/features/lab-reports/components/BiomarkersStep.tsx:10-23](frontend/src/features/lab-reports/components/BiomarkersStep.tsx#L10-L23)

```tsx
export function BiomarkersStep({ labReportSlug, onBack, onSuccess }) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Extract Biomarkers</CardTitle>
        <CardDescription>Input key metrics to make them searchable and trendable for the doctor.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BiomarkersForm labReportSlug={labReportSlug} onBack={onBack} onSuccess={onSuccess} />
      </CardContent>
    </>
  );
}
```

`labReportSlug` is the unique slug generated during Step 1. It becomes the route parameter for the PATCH request.

---

### Step 2 — BiomarkersForm and dynamic rows

**File:** [frontend/src/features/lab-reports/biomarker/BiomarkersForm.tsx:10-75](frontend/src/features/lab-reports/biomarker/BiomarkersForm.tsx#L10-L75)

```tsx
export function BiomarkersForm({ labReportSlug, onBack, onSuccess }) {
  const { form, completeMutation, submitError, biomarkerSchema, createEmptyBiomarkerRow } = useBiomarkersForm({ labReportSlug, onSuccess });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }} noValidate>
      <form.Field name="biomarkers">
        {(field) => (
          <>
            <BiomarkersHeader onAdd={() => field.pushValue(createEmptyBiomarkerRow())} />
            <div className="space-y-3">
              {field.state.value.length === 0 && (
                <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
                  No metrics added yet.
                </p>
              )}
              {(field.state.value as Biomarker[]).map((row, i) => (
                <BiomarkerRow key={row._id} index={i} form={form} onRemove={() => field.removeValue(i)} biomarkerSchema={biomarkerSchema} />
              ))}
            </div>
          </>
        )}
      </form.Field>

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

      <div className="flex justify-between pt-6 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}>Back</Button>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" disabled={!canSubmit || completeMutation.isPending}>
              {completeMutation.isPending ? "Finalizing..." : "Publish & Notify Patient"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
```

| Line | What it does |
|------|-------------|
| 12 | `useBiomarkersForm` hook sets up TanStack Form, the mutation, and Zod validation |
| 24 | `<form.Field name="biomarkers">` — TanStack Form manages the array of biomarker rows |
| 27 | `BiomarkersHeader` contains the "Add Biomarker" button, which calls `field.pushValue(...)` to append a new empty row |
| 30–34 | Empty state — dashed border box prompting the technician to add metrics |
| 36–43 | Maps each biomarker row to `<BiomarkerRow>` — each row gets an `onRemove` callback that calls `field.removeValue(i)` |
| 50–53 | `submitError` — displayed in red if the mutation fails (e.g. network error or 409 conflict) |
| 56–58 | Back button — calls `onBack()` which is `goBack()` from the wizard, returning to Step 1 |
| 60–72 | Submit button — disabled while `!canSubmit` (form is invalid) or while `completeMutation.isPending` (request in flight). Shows "Finalizing..." spinner during submission |

---

### Step 3 — Zod schema validates every row

**File:** [frontend/src/features/lab-reports/biomarker/schema.ts:3-13](frontend/src/features/lab-reports/biomarker/schema.ts#L3-L13)

```ts
export const biomarkerSchema = z.object({
  name: z.string().min(1, "Name required"),
  value: z.string().min(1, "Value required"),
  unit: z.string().min(1, "Unit required"),
  referenceRange: z.string().min(1, "Range required"),
  flag: z.enum(["normal", "high", "low"]),
});

export const reportSchema = z.object({
  biomarkers: z.array(biomarkerSchema).default([]),
});
```

| Field | Rule |
|-------|------|
| `name` | Non-empty string (e.g. "Hemoglobin") |
| `value` | Non-empty string (e.g. "13.5") |
| `unit` | Non-empty string (e.g. "g/dL") |
| `referenceRange` | Non-empty string (e.g. "12.0-16.0") |
| `flag` | Must be one of `"normal"`, `"high"`, `"low"` |

TanStack Form runs this schema in real time. `canSubmit` is `false` until every filled row passes all 5 rules.

---

### Step 4 — Submit mutation

**File:** [frontend/src/features/lab-reports/biomarker/hooks/useBiomarkersForm.ts:13-31](frontend/src/features/lab-reports/biomarker/hooks/useBiomarkersForm.ts#L13-L31)

```ts
export function useBiomarkersForm({ labReportSlug, onSuccess }) {
  const completeMutation = useUpdateBySlug();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { biomarkers: [] },
    onSubmit: async ({ value }) => {
      try {
        await completeMutation.mutateAsync({
          slug: labReportSlug,
          data: { biomarkers: value.biomarkers },
        });
        onSuccess();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to complete lab report.";
        setSubmitError(message);
      }
    },
  });
```

| Line | What it does |
|------|-------------|
| 14 | `useUpdateBySlug()` — orval-generated mutation hook for `PATCH /api/v1/lab-reports/{slug}/complete` |
| 18 | `defaultValues: { biomarkers: [] }` — form starts with an empty array |
| 21–24 | `mutateAsync({ slug, data: { biomarkers } })` — sends the biomarker array to the backend |
| 25 | `onSuccess()` — triggers `handleSuccess()` in the wizard, advancing to Step 3 |

---

### Step 5 — Backend completes the report and fires the event

**File:** [backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportHandler.cs:12-48](backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportHandler.cs#L12-L48)

| Line | What it does |
|------|-------------|
| 16–19 | Loads the report by `slug` with `.Include(r => r.Patient).ThenInclude(p => p.User)` — needs the patient to build the event |
| 21–25 | If report not found → throws `LabReportNotFoundException` |
| 27–31 | If report is already `Completed` → throws `DuplicateLabReportException` (idempotent guard) |
| 33 | `StatusId = StatusId.LabReport.Completed` |
| 34 | `Biomarkers = cmd.Biomarkers` — stores the JSON array in the `Biomarkers` JSONB column |
| 35 | `UploadedAt = SystemClock.Instance.GetCurrentInstant()` — sets the completion timestamp using NodaTime |
| 37–42 | Builds `LabReportCompletedEvent` with `PublicId`, `PatientPublicId`, `ReportType`, and `OccurredAt` |
| 44 | `publishEndpoint.Publish(completedEvent, ct)` — MassTransit publishes to the configured SNS topic (`medical-alerts-topic`) |
| 45 | `db.SaveChangesAsync(ct)` — persists the status, biomarkers, and timestamp to PostgreSQL |

**Endpoint:** [backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportEndpoint.cs:12-33](backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportEndpoint.cs#L12-L33)

| Line | What it does |
|------|-------------|
| 12 | `MapPatch` — `PATCH /api/v1/lab-reports/{slug}/complete` |
| 27 | `.RequireAuthorization(AuthConstants.LabTechPolicy)` — only lab techs can complete |
| 33 | `.AddEndpointFilter<ValidationFilter<CompleteLabReportCommand>>()` — validates the biomarker array shape before the handler runs |

Think of the event publish like ringing a bell in the hospital corridor — the backend rings it, and any downstream service (the `lab-pdf-processor` Lambda, notification services, audit loggers) that is listening on the SNS topic hears it and reacts.

---

### Full chain — Feature 3

```
LabReportUploadWizard.tsx:45   → step === 2 → <BiomarkersStep labReportSlug={slug} />
BiomarkersStep.tsx:20          → <BiomarkersForm labReportSlug={slug} onSuccess={handleSuccess} />
BiomarkersForm.tsx:12          → useBiomarkersForm({ labReportSlug, onSuccess })
useBiomarkersForm.ts:14        → useUpdateBySlug() → PATCH /api/v1/lab-reports/{slug}/complete
schema.ts:3                    → biomarkerSchema: name, value, unit, referenceRange, flag (all required)
BiomarkersForm.tsx:24          → <form.Field name="biomarkers"> → dynamic array
BiomarkersForm.tsx:27          → BiomarkersHeader onAdd → pushValue(createEmptyBiomarkerRow())
BiomarkersForm.tsx:62          → form.Subscribe canSubmit → disables submit until valid
BiomarkersForm.tsx:67          → "Publish & Notify Patient" button → form.handleSubmit()
useBiomarkersForm.ts:21        → completeMutation.mutateAsync({ slug, data: { biomarkers } })
CompleteLabReportEndpoint.cs:12 → MapPatch /{slug}/complete
CompleteLabReportHandler.cs:16 → loads report by slug, includes Patient.User
CompleteLabReportHandler.cs:23 → throws LabReportNotFoundException if missing
CompleteLabReportHandler.cs:29 → throws DuplicateLabReportException if already completed
CompleteLabReportHandler.cs:33 → StatusId = Completed
CompleteLabReportHandler.cs:34 → Biomarkers = cmd.Biomarkers (JSONB)
CompleteLabReportHandler.cs:35 → UploadedAt = SystemClock.Instance.GetCurrentInstant()
CompleteLabReportHandler.cs:44 → publishEndpoint.Publish(LabReportCompletedEvent) → MassTransit → SNS
useBiomarkersForm.ts:25        → onSuccess() → handleSuccess() → setStep(3)
LabReportUploadWizard.tsx:26   → step === 3 → <SuccessScreen />
```

---

## Feature 4 — Success Screen

**What the user sees:** A large green checkmark, the message "The {reportType} report has been securely saved, and the patient has been notified via email.", and an "Upload Another" outline button.

**File:** [frontend/src/features/lab-reports/components/SuccessScreen.tsx:5-27](frontend/src/features/lab-reports/components/SuccessScreen.tsx#L5-L27)

```tsx
type SuccessScreenProps = {
  reportType: string;
  onReset: () => void;
};

export function SuccessScreen({ reportType, onReset }: SuccessScreenProps) {
  return (
    <Card className="shadow-lg border-green-500/20">
      <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-green-100 p-3 text-green-600" aria-hidden="true">
          <CheckCircle2 className="size-12" />
        </div>
        <CardTitle className="text-2xl">Report Published!</CardTitle>
        <CardDescription className="max-w-sm mx-auto">
          The {reportType} report has been securely saved, and the patient has been notified via email.
        </CardDescription>
        <Button className="mt-4" onClick={onReset} variant="outline">
          Upload Another
        </Button>
      </CardContent>
    </Card>
  );
}
```

| Line | What it does |
|------|-------------|
| 5–8 | Props: receives `reportType` (e.g. "Full Blood Count") and `onReset` callback |
| 12 | Card with a faint green border (`border-green-500/20`) |
| 14–16 | Large green circle with a 48px checkmark icon |
| 18 | Title: "Report Published!" |
| 19–21 | Descriptive message — reassures the technician the patient was notified |
| 22–24 | "Upload Another" button — calls `onReset()` which is `handleReset()` from `useWizard`, returning to Step 1 and clearing all state |

---

### Full chain — Feature 4

```
SuccessScreen.tsx:5            → Props: { reportType, onReset }
SuccessScreen.tsx:14           → Green checkmark card
SuccessScreen.tsx:19           → "The {reportType} report has been securely saved..."
SuccessScreen.tsx:22           → "Upload Another" button → onReset → handleReset()
useWizard.ts:14                → handleReset → setStep(1), setLabReportSlug(null), setReportType("Full Blood Count")
LabReportUploadWizard.tsx:35   → step === 1 → renders <UploadStep /> (fresh start)
```

---

## Feature 5 — Download Lab Report (View PDF)

**What the user sees:** In any table or patient history list, each report row has a "View PDF" button. Clicking it opens the PDF in a new browser tab. If the viewer is a patient, they can only download their own reports — the backend enforces ownership.

---

### Step 1 — Frontend requests the presigned download URL

**File:** [frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx:112-124](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx#L112-L124)

```ts
const handleViewReport = async (report: LabReportDto) => {
  try {
    const response = await getBySlug(report.slug);
    if (response.status === 200) {
      const url = response.data.downloadUrl;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch {
    toast.error("Unable to open report. Please try again.");
  }
};
```

`getBySlug` is an orval-generated async function (not a React hook) that sends `GET /api/v1/lab-reports/{slug}/download`. It returns `{ downloadUrl: string }` — a presigned S3 GET URL. The browser then opens that URL directly, streaming the PDF from S3.

---

### Step 2 — Backend validates ownership and returns the presigned URL

**File:** [backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportHandler.cs:9-48](backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportHandler.cs#L9-L48)

| Line | What it does |
|------|-------------|
| 18–22 | Loads the report by `slug` with `.Include(r => r.Patient).ThenInclude(p => p.User)` |
| 24–28 | If report missing → throws `LabReportNotFoundException` |
| 30–38 | **Role-based access control:** If the caller's role is `"patient"`, verifies `report.Patient.User.PublicId == userPublicId`. If not their own report → throws `LabReportAccessDeniedException` |
| 41–45 | If `S3ObjectKey` is empty or whitespace → throws `S3UploadFailedException` (the PDF was never actually uploaded) |
| 47 | Returns `s3Service.GeneratePreSignedDownloadUrl(report.S3ObjectKey)` — a temporary S3 GET URL |

**Endpoint:** [backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportEndpoint.cs:14-41](backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportEndpoint.cs#L14-L41)

| Line | What it does |
|------|-------------|
| 14 | `MapGet` — `GET /api/v1/lab-reports/{slug}/download` |
| 23–29 | Reads `NameIdentifier` (publicId) and `Role` claims from the JWT cookie |
| 38 | `.RequireAuthorization()` — **any authenticated user** can call this, not just lab techs. Patients need this to view their own reports |

Think of it like a medical records room: anyone with a valid staff badge can ask for a file, but if a patient asks, the clerk checks the file label to make sure it has that patient's name on it before handing it over.

---

### Full chain — Feature 5

```
LabReportsTable.tsx:99           → "View PDF" button → onViewReport(report)
LabTechLabReportsPage.tsx:112    → getBySlug(report.slug) → GET /api/v1/lab-reports/{slug}/download
                                 → returns { downloadUrl }
LabTechLabReportsPage.tsx:118    → window.open(url, "_blank")
                                 → browser streams PDF directly from S3
DownloadLabReportEndpoint.cs:14  → MapGet /{slug}/download
DownloadLabReportEndpoint.cs:23  → reads NameIdentifier + Role claims from JWT
DownloadLabReportHandler.cs:18   → loads report by slug
DownloadLabReportHandler.cs:30   → if role === "patient" → verify ownership
DownloadLabReportHandler.cs:41   → check S3ObjectKey exists
DownloadLabReportHandler.cs:47   → GeneratePreSignedDownloadUrl → returns to frontend
```

---

## PII & Data Minimization Notes

**LabTechPatientDto intentionally excludes sensitive fields.**

**File:** [backend/src/TeleHealth.Api/Features/LabReports/GetAllPatients/LabTechPatientDto.cs:5-11](backend/src/TeleHealth.Api/Features/LabReports/GetAllPatients/LabTechPatientDto.cs#L5-L11)

```csharp
public sealed record LabTechPatientDto(
    Guid PatientPublicId,
    string Slug,
    string FirstName,
    string LastName,
    string FullName
);
```

This DTO is used for the patient picker in the "Upload New" tab. It deliberately does **not** include:
- Email address
- IC number
- Date of birth
- Phone number

This is intentional PII minimization. A lab technician needs to know *which patient* a report belongs to, but they do not need contact details or identity numbers to perform their job. The `FullName` field is constructed as `"{FirstName} {LastName}"` purely for display and search.

---

## File Index (Lab Technician Features Only)

### Frontend

| File | Feature |
|------|---------|
| [routes/_protected/dashboard.tsx](frontend/src/routes/_protected/dashboard.tsx) | Route entry for dashboard |
| [features/dashboard/Dashboard.tsx](frontend/src/features/dashboard/Dashboard.tsx) | Role dispatcher (renders LabTechDashboard) |
| [features/dashboard/roles/LabTechnicianDashboard.tsx](frontend/src/features/dashboard/roles/LabTechnicianDashboard.tsx) | Lab tech stat cards + inline LabOrdersTable |
| [routes/_protected/lab-reports_.tsx](frontend/src/routes/_protected/lab-reports_.tsx) | Route entry for /lab-reports |
| [features/lab-reports/LabReportsPage.tsx](frontend/src/features/lab-reports/LabReportsPage.tsx) | Role dispatcher (renders LabTechLabReportsPage) |
| [features/lab-reports/roles/LabTechLabReportsPage.tsx](frontend/src/features/lab-reports/roles/LabTechLabReportsPage.tsx) | Tabs, stats, table, patient picker, wizard trigger |
| [features/lab-reports/components/LabReportsStats.tsx](frontend/src/features/lab-reports/components/LabReportsStats.tsx) | 3 stat cards (Pending, Completed, Total) |
| [features/lab-reports/components/LabReportsTable.tsx](frontend/src/features/lab-reports/components/LabReportsTable.tsx) | Reports table with search + pagination |
| [features/lab-reports/components/PatientLabReportsView.tsx](frontend/src/features/lab-reports/components/PatientLabReportsView.tsx) | Patient card + report history + upload button |
| [features/lab-reports/LabReportUploadWizard.tsx](frontend/src/features/lab-reports/LabReportUploadWizard.tsx) | 3-step wizard shell (Upload → Biomarkers → Success) |
| [features/lab-reports/hooks/useWizard.ts](frontend/src/features/lab-reports/hooks/useWizard.ts) | Wizard state machine (step, slug, reportType) |
| [features/lab-reports/components/UploadStep.tsx](frontend/src/features/lab-reports/components/UploadStep.tsx) | Step 1 layout: ReportTypeSelector + S3PdfDropzone |
| [features/lab-reports/components/ReportTypeSelector.tsx](frontend/src/features/lab-reports/components/ReportTypeSelector.tsx) | Dropdown of REPORT_TYPES |
| [features/lab-reports/dropzone/S3PdfDropzone.tsx](frontend/src/features/lab-reports/dropzone/S3PdfDropzone.tsx) | Drag-and-drop zone UI + file preview |
| [features/lab-reports/dropzone/hooks/useS3FileUpload.ts](frontend/src/features/lab-reports/dropzone/hooks/useS3FileUpload.ts) | Core upload logic: initialize → S3 PUT → notify |
| [features/lab-reports/dropzone/constants.ts](frontend/src/features/lab-reports/dropzone/constants.ts) | PDF-only, 10 MB max |
| [features/lab-reports/components/BiomarkersStep.tsx](frontend/src/features/lab-reports/components/BiomarkersStep.tsx) | Step 2 layout: BiomarkersForm |
| [features/lab-reports/biomarker/BiomarkersForm.tsx](frontend/src/features/lab-reports/biomarker/BiomarkersForm.tsx) | Dynamic biomarker rows + submit button |
| [features/lab-reports/biomarker/hooks/useBiomarkersForm.ts](frontend/src/features/lab-reports/biomarker/hooks/useBiomarkersForm.ts) | TanStack Form setup + useUpdateBySlug mutation |
| [features/lab-reports/biomarker/schema.ts](frontend/src/features/lab-reports/biomarker/schema.ts) | Zod schema for biomarker rows |
| [features/lab-reports/components/SuccessScreen.tsx](frontend/src/features/lab-reports/components/SuccessScreen.tsx) | Step 3: green checkmark + reset button |
| [api/generated/lab-reports/lab-reports.ts](frontend/src/api/generated/lab-reports/lab-reports.ts) | Auto-generated orval client (useGetAllLabReports, useCreate, useUpdateBySlug, getBySlug) |
| [api/generated/patients/patients.ts](frontend/src/api/generated/patients/patients.ts) | Auto-generated orval client (useGetAllPatientsForClinicStaff) |

### Backend

| File | Feature |
|------|---------|
| [Features/LabReports/GetAllLabReports/GetAllLabReportsEndpoint.cs](backend/src/TeleHealth.Api/Features/LabReports/GetAllLabReports/GetAllLabReportsEndpoint.cs) | `GET /api/v1/lab-reports` |
| [Features/LabReports/GetAllLabReports/GetAllLabReportsHandler.cs](backend/src/TeleHealth.Api/Features/LabReports/GetAllLabReports/GetAllLabReportsHandler.cs) | Query + filter + page lab reports |
| [Features/LabReports/GetAllPatients/LabTechGetAllPatientsEndpoint.cs](backend/src/TeleHealth.Api/Features/LabReports/GetAllPatients/LabTechGetAllPatientsEndpoint.cs) | `GET /api/v1/lab-reports/patients` |
| [Features/LabReports/GetAllPatients/LabTechGetAllPatientsHandler.cs](backend/src/TeleHealth.Api/Features/LabReports/GetAllPatients/LabTechGetAllPatientsHandler.cs) | Patient list for lab tech (PII-minimized) |
| [Features/LabReports/GetAllPatients/LabTechPatientDto.cs](backend/src/TeleHealth.Api/Features/LabReports/GetAllPatients/LabTechPatientDto.cs) | DTO: PublicId, Slug, FirstName, LastName, FullName only |
| [Features/LabReports/InitializeUpload/InitializeLabReportEndpoint.cs](backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportEndpoint.cs) | `POST /api/v1/lab-reports/initialize` |
| [Features/LabReports/InitializeUpload/InitializeLabReportHandler.cs](backend/src/TeleHealth.Api/Features/LabReports/InitializeUpload/InitializeLabReportHandler.cs) | Creates DB row + S3 presigned PUT URL |
| [Features/LabReports/Complete/CompleteLabReportEndpoint.cs](backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportEndpoint.cs) | `PATCH /api/v1/lab-reports/{slug}/complete` |
| [Features/LabReports/Complete/CompleteLabReportHandler.cs](backend/src/TeleHealth.Api/Features/LabReports/Complete/CompleteLabReportHandler.cs) | Marks completed, stores biomarkers JSONB, publishes MassTransit event |
| [Features/LabReports/Download/DownloadLabReportEndpoint.cs](backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportEndpoint.cs) | `GET /api/v1/lab-reports/{slug}/download` |
| [Features/LabReports/Download/DownloadLabReportHandler.cs](backend/src/TeleHealth.Api/Features/LabReports/Download/DownloadLabReportHandler.cs) | Ownership check + S3 presigned GET URL |
| [Infrastructure/Aws/S3Service.cs](backend/src/TeleHealth.Api/Infrastructure/Aws/S3Service.cs) | AWS S3 presigned URL generation |
| [Infrastructure/Aws/IS3Service.cs](backend/src/TeleHealth.Api/Infrastructure/Aws/IS3Service.cs) | S3 service interface |

---

## API Endpoints Summary

| Method | Path | Auth | Feature |
|--------|------|------|---------|
| `GET` | `/api/v1/lab-reports` | LabTech | List / search / filter lab reports |
| `GET` | `/api/v1/lab-reports/patients` | LabTech | Patient picker (PII-minimized) |
| `POST` | `/api/v1/lab-reports/initialize` | LabTech | Initialize report + get S3 presigned PUT URL |
| `PATCH` | `/api/v1/lab-reports/{slug}/complete` | LabTech | Complete report + store biomarkers + publish event |
| `GET` | `/api/v1/lab-reports/{slug}/download` | Any auth | Download PDF (patient ownership enforced) |
| `GET` | `/api/v1/patients/staff` | Clinic staff | General patient search (used by multiple staff roles) |

---

## MassTransit / Messaging Summary

| Event | Publisher | Topic | Consumer |
|-------|-----------|-------|----------|
| `LabReportCompletedEvent` | `CompleteLabReportHandler` | SNS `medical-alerts-topic` | SQS → `lab-pdf-processor` Lambda (scaffolded) |

Event shape:
```csharp
new LabReportCompletedEvent(
    report.PublicId,           // Guid
    report.Patient.PublicId,   // Guid
    report.ReportType,         // string
    SystemClock.Instance.GetCurrentInstant()  // NodaTime Instant
);
```

This event is fired after the database transaction commits, ensuring the report is truly `Completed` before any downstream processor acts on it.
