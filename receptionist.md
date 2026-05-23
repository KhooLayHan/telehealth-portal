# Receptionist Feature — Full Reference Guide

> For presentation use. Covers every receptionist feature end-to-end: Route → Frontend → API Client → Backend Endpoint → Handler → Database. AWS SES is included for appointment reminder emails and AWS S3 for profile photo upload.

---

## Writing Style Guide (for future reference)

Each feature section follows this pattern:
- **Step number + plain English title** — one sentence saying what the user sees or what happens
- **File link with exact line numbers** — clickable, format: `[path/to/File.tsx:line](path/to/File.tsx#Lline)`
- **Code snippet** — only the relevant lines, not the whole file
- **Line-by-line explanation** — each important line explained in plain English, no jargon without definition
- **Human analogy** — one sentence comparing it to something real ("Think of it like...")
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
                                                        [AWS SES — appointment reminder emails]
                                                        [AWS S3  — profile photo upload]
```

**Tech stack:**
- **Frontend:** React + TypeScript, TanStack Router, TanStack Query, shadcn/ui, Framer Motion
- **Backend:** ASP.NET Core (.NET 9), Minimal API, handlers, EF Core, NodaTime
- **DB:** PostgreSQL (NodaTime dates — `LocalDate`, `LocalTime`)
- **AWS:** S3 (profile images bucket — presigned PUT upload), SES v2 (reminder emails)

---

## Feature 0 — Login → Receptionist Dashboard

**What the user sees:** Receptionist types email + password → clicks Login → lands on the receptionist dashboard with their name in the greeting and avatar in the sidebar.

**Steps 1–6 (login form → backend JWT → getMe → Zustand auth store → navigate `/dashboard` → role dispatch) are identical to the doctor flow documented in `doctor.md` Feature 0.** The same login mechanism, JWT cookie, `getMe` orval-generated client, `useAuthStore` (Zustand), and `pickPrimaryRole` dispatch are used for all roles.

---

### Step 7 — Dashboard reads the role from the store → shows the receptionist dashboard

**File:** [frontend/src/features/dashboard/Dashboard.tsx:14-28](frontend/src/features/dashboard/Dashboard.tsx#L14-L28)

```tsx
switch (user?.role?.toLowerCase()) {
  case "patient":      return <PatientDashboard />;
  case "receptionist": return <ReceptionistDashboard />;
  case "doctor":       return <DoctorDashboard />;
  case "admin":        return <AdminDashboard />;
  case "lab-tech":     return <LabTechDashboard />;
}
```

When `user.role` is `"receptionist"`, React renders `<ReceptionistDashboard />`. The URL stays `/dashboard` for all roles — the switch statement is what changes the view.

Think of it like a hotel key card — every guest uses the same door, but the card tells the lock which floor to let you onto.

---

### Step 8 — AppShell shows receptionist name + avatar in the sidebar

**File:** [frontend/src/components/layout/AppShell.tsx:108-115](frontend/src/components/layout/AppShell.tsx#L108-L115)

```tsx
const { user, logout } = useAuthStore();
const normalizedRole = user?.role?.toLowerCase();
const userInitial = user?.firstName?.charAt(0).toUpperCase() ?? "U";
const avatarUrl = user?.avatarUrl;
```

The sidebar reads `firstName` and `avatarUrl` straight from the Zustand store — the same values saved during login. No extra API call is made. The sidebar and header both update the moment login completes.

---

### Full chain — Feature 0

```
useLoginForm.ts:26       → POST /auth/login
LoginHandler.cs:42       → verifies password, writes JWT cookie with role embedded
useLoginForm.ts:27       → calls getMe() (orval-generated)
users.ts:173             → GET /api/v1/me (cookie auto-attached)
GetMeEndpoint.cs:46-70   → reads JWT, queries DB, returns { firstName, role: "receptionist", avatarUrl }
useLoginForm.ts:44-51    → setAuth() → saves into useAuthStore (Zustand)
useAuthStore.ts:22       → holds { role, firstName, avatarUrl } in memory for the session
useLoginForm.ts:53       → navigate("/dashboard")
Dashboard.tsx:15         → reads role → renders <ReceptionistDashboard />
AppShell.tsx:108-115     → reads firstName + avatarUrl from store → shows in sidebar
```

---

## Feature 1 — Receptionist Dashboard

**What the user sees:** Four stat cards (Total Appointments / In Queue / Completed / Cancelled) + a live table of today's booked appointment slots with queue numbers and doctor names. The whole page refreshes silently every 3 seconds.

### Step-by-step flow

```
Route → Dashboard.tsx → ReceptionistDashboard
    → useGetDailySchedulesForReceptionist (polling, every 3 s) → GET /api/v1/schedules/daily
    → useGetAllStatuses → GET /api/v1/appointments/statuses
    → useMemo: count queue / completed / cancelled
    ← slot list ← DashboardStatCards + ScheduleQueueTable render
```

---

### 1.1 Route

**File:** [frontend/src/routes/_protected/dashboard.tsx](frontend/src/routes/_protected/dashboard.tsx)

The `/_protected` prefix enforces the login guard at the TanStack Router layout level. The route renders `<Dashboard />` which dispatches to `<ReceptionistDashboard />` based on role (see Feature 0 Step 7).

---

### 1.2 ReceptionistDashboard mounts and starts two parallel queries

**File:** [frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx:9-24](frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx#L9-L24)

```tsx
export function ReceptionistDashboard() {
  const today = getTodayStr();
  const POLL_INTERVAL_MS = 3_000;

  const { data: scheduleData, isLoading: loadingSlots } = useGetDailySchedulesForReceptionist(
    { Date: today },
    { query: { refetchInterval: POLL_INTERVAL_MS, refetchIntervalInBackground: false } },
  );

  const { data: statusData } = useGetAllStatuses();
```

| Line | What it does |
|------|-------------|
| 10 | `getTodayStr()` — returns today as `"YYYY-MM-DD"` using the system clock |
| 12 | `POLL_INTERVAL_MS = 3_000` — the dashboard re-fetches every 3 seconds |
| 14–22 | Calls `useGetDailySchedulesForReceptionist` — fires `GET /api/v1/schedules/daily?Date=today` with auto-polling |
| 24 | Calls `useGetAllStatuses` — fetches all possible appointment statuses with their `slug` and `isTerminal` flags |

Both queries run in parallel (TanStack Query fires them simultaneously). The schedule data gives slot details; the status data tells the component which statuses are "terminal" (Completed, Cancelled, No-Show) so it can count the queue correctly.

---

### 1.3 useMemo processes the raw slots into counts

**File:** [frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx:26-62](frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx#L26-L62)

```tsx
const slots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
  () => (scheduleData?.status === 200 ? scheduleData.data : []),
  [scheduleData],
);

const bookedSlots = useMemo(() => slots.filter((s) => !!s.patientName), [slots]);

const terminalSlugs = useMemo(
  () => new Set(statuses.filter((s) => s.isTerminal).map((s) => s.slug ?? "")),
  [statuses],
);

const inQueueCount = bookedSlots.filter((s) => {
  const slug = statuses.find((st) => st.name === s.appointmentStatus)?.slug ?? "";
  return !terminalSlugs.has(slug);
}).length;

const completedCount = bookedSlots.filter(
  (s) => statuses.find((st) => st.name === s.appointmentStatus)?.slug === "completed",
).length;
```

| Line | What it does |
|------|-------------|
| 26–29 | Unwraps `scheduleData` — only uses it when `status === 200`, otherwise falls back to `[]` |
| 34 | `bookedSlots` — filters to only slots that have a patient (i.e., are actually booked) |
| 36–39 | `terminalSlugs` — a `Set` of slugs like `"completed"`, `"cancelled"`, `"no-show"` |
| 41–44 | `inQueueCount` — booked slots whose status is not in `terminalSlugs` (still active) |
| 46–48 | `completedCount` — booked slots with slug `"completed"` |
| 50–52 | `cancelledCount` — booked slots with slug `"cancelled"` |

Think of it like a hospital whiteboard — all slots are listed, but the receptionist only counts the ones that still have a patient waiting.

---

### 1.4 orval-generated hook sends the HTTP request

**File:** [frontend/src/api/generated/schedules/schedules.ts](frontend/src/api/generated/schedules/schedules.ts)

```ts
export const useGetDailySchedulesForReceptionist = (
  params: GetDailySchedulesForReceptionistParams,
  options?: { query?: UseQueryOptions<...> }
) => useQuery({
  queryKey: ["GetDailySchedulesForReceptionist", params],
  queryFn: () => ofetchMutator(`/api/v1/schedules/daily`, { params }),
  ...options?.query,
});
```

This file is auto-generated by **orval** from the backend's OpenAPI spec. Do not edit it manually. The hook wraps `GET /api/v1/schedules/daily` and adds TanStack Query's caching, polling, and error handling on top.

---

### 1.5 Backend endpoint receives the request

**File:** [backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesEndpoint.cs:9-28](backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesEndpoint.cs#L9-L28)

```csharp
group
  .MapGet(
    ApiEndpoints.Schedules.GetDailyForReceptionist,
    async Task<Ok<List<ReceptionistDoctorScheduleSlotDto>>> (
      [AsParameters] GetDailySchedulesQuery query,
      GetDailySchedulesHandler handler,
      CancellationToken ct
    ) => {
      var slots = await handler.HandleAsync(query, ct);
      return TypedResults.Ok(slots);
    }
  )
  .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy);
```

| Line | What it does |
|------|-------------|
| 12–13 | `MapGet(ApiEndpoints.Schedules.GetDailyForReceptionist, ...)` → registers `GET /api/v1/schedules/daily` |
| 14 | Return type is `Ok<List<ReceptionistDoctorScheduleSlotDto>>` — a flat list of slots |
| 15 | `[AsParameters] GetDailySchedulesQuery` — maps `Date` and `DoctorPublicId` from the query string automatically |
| 26 | `.RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)` — both admin and receptionist roles can call this |

---

### 1.6 Handler queries the database and builds the slot list

**File:** [backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesHandler.cs:9-91](backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesHandler.cs#L9-L91)

```csharp
var dbQuery = db.DoctorSchedules.AsNoTracking()
    .Include(s => s.ScheduleStatus)
    .Include(s => s.Doctor).ThenInclude(d => d.User)
    .Where(s => s.Date == targetDate);

var schedules = await dbQuery
    .OrderBy(s => s.StartTime)
    .ThenBy(s => s.Doctor.User.LastName)
    .ToListAsync(ct);
```

| Line | What it does |
|------|-------------|
| 22 | Parses `query.Date` into a NodaTime `LocalDate` — rejects invalid formats |
| 31–36 | Queries `DoctorSchedules` for the target date, eagerly loads `ScheduleStatus` and `Doctor.User` |
| 43–46 | Orders by `StartTime` then doctor last name — so the queue table shows chronological order |
| 53–64 | Loads **all** appointments for those slot IDs, groups by `ScheduleId`, takes the most recent per slot. This ensures a re-booked slot shows the current active appointment, not a previous cancelled one |
| 66–90 | Maps each slot to `ReceptionistDoctorScheduleSlotDto` — sets `PatientName = null` for unbooked slots, fills doctor name + appointment status when booked |

---

### 1.7 Response flows back → component renders stat cards and queue table

**File:** [frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx:64-105](frontend/src/features/dashboard/roles/ReceptionistDashboard.tsx#L64-L105)

```tsx
<DashboardStatCards
  totalAppointments={bookedSlots.length}
  inQueueCount={inQueueCount}
  completedCount={completedCount}
  cancelledCount={cancelledCount}
/>
<ScheduleQueueTable rows={tableRows} statuses={statuses} isLoading={loadingSlots} today={today} />
```

`tableRows` is `bookedSlots.map((slot, i) => ({ queueNum: i + 1, slot }))` — each booked slot gets a sequential queue number starting at 1. The table header shows today's date and a count badge. The polling means this entire re-render happens automatically every 3 seconds without any user action.

---

### Full chain — Feature 1

```
dashboard.tsx          → /_protected route, renders <Dashboard />
Dashboard.tsx:15       → reads role "receptionist" → renders <ReceptionistDashboard />
ReceptionistDashboard.tsx:14  → useGetDailySchedulesForReceptionist({ Date: today }, refetchInterval: 3000)
schedules.ts           → GET /api/v1/schedules/daily?Date=2026-05-23
GetDailySchedulesEndpoint.cs:26 → AdminOrReceptionistPolicy check passes
GetDailySchedulesHandler.cs:31  → queries DoctorSchedules for today, loads appointments
GetDailySchedulesHandler.cs:66  → maps to ReceptionistDoctorScheduleSlotDto[]
ReceptionistDashboard.tsx:26-62 → useMemo counts queue/completed/cancelled
ReceptionistDashboard.tsx:66    → renders DashboardStatCards + ScheduleQueueTable
```

---

## Feature 2 — All Appointments Page

**What the user sees:** A full-page table of all appointments — searchable by patient/doctor/reason, filterable by status and "Today only" toggle, with View, Edit, and Send Reminder actions per row. The table auto-refreshes every 3 seconds.

### Step-by-step flow

```
Navigate /appointments → Route → AppointmentsPage → ReceptionistApptPage
    → search / filter / pagination state
    → useGetAllAppointmentsForReceptionist (polling) → GET /api/v1/appointments
    → Handler: view / status / search / date / sort filters → DB
    ← PagedResult<ReceptionistAppointmentDto> ← table renders rows
    [Eye icon] → navigate to /appointments/{id}
    [Pencil icon] → navigate to /appointments/edit/{id}
    [Bell icon] → useRemindPatient → POST /api/v1/appointments/{id}/remind → SES email
```

---

### 2.1 Route

**File:** [frontend/src/routes/_protected/appointments_.tsx](frontend/src/routes/_protected/appointments_.tsx)

Registers `/appointments` under `/_protected`. Renders the appointments page component which dispatches `<ReceptionistApptPage>` for the receptionist role.

---

### 2.2 Component initialises state: search, status filter, pagination, and today-toggle

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:439-452](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L439-L452)

```tsx
export function ReceptionistApptPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);
```

| Line | What it does |
|------|-------------|
| 440 | `page` — current page number, starts at 1 |
| 441–442 | Two separate strings: `searchInput` (raw keystrokes) and `search` (debounced value sent to the API) |
| 443 | `statusFilter` — the slug of the currently selected status pill, empty means "All" |
| 444 | `todayOnly` — when true, restricts `From` and `To` dates to today |
| 446–452 | 500 ms debounce — waits half a second after the user stops typing before updating `search` and resetting to page 1 |

---

### 2.3 Component calls the orval hook with all active filters

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:456-472](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L456-L472)

```tsx
const { data, isLoading, isError } = useGetAllAppointmentsForReceptionist(
  {
    Page: page,
    PageSize: PAGE_SIZE,       // 10
    SortOrder: "desc",
    Search: search || undefined,
    Status: statusFilter || undefined,
    From: todayOnly ? today : undefined,
    To: todayOnly ? today : undefined,
  },
  { query: { refetchInterval: POLL_INTERVAL_MS, refetchIntervalInBackground: false } },
);
```

Every time `page`, `search`, `statusFilter`, or `todayOnly` changes, TanStack Query fires a new request with updated params. `refetchInterval: 3_000` also means a fresh request fires every 3 seconds automatically, so the table stays live even if the receptionist isn't typing.

---

### 2.4 Filter bar renders above the table

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:248-324](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L248-L324)

| Line | What it does |
|------|-------------|
| 250–267 | Search `<Input>` — calls `onSearchChange` on every keystroke, which updates `searchInput`. The 500 ms debounce in the parent turns it into `search` after the user pauses |
| 269–298 | Status filter pills — one pill per status from `useGetAllStatuses`. Clicking a pill sets `statusFilter` to that slug. Clicking it again (or clicking "All") clears the filter |
| 300–307 | "Today only" `<Switch>` — when toggled on, sends `From=today&To=today` to the backend |
| 309–324 | "Clear filters" button — only visible when any filter is active; resets search, status, and toggle to defaults |

Think of it like a pharmacy counter — the receptionist narrows down the full appointment list the same way a pharmacist searches a prescription database.

---

### 2.5 orval hook fires the HTTP request

**File:** [frontend/src/api/generated/appointments/appointments.ts](frontend/src/api/generated/appointments/appointments.ts)

Auto-generated by orval. `useGetAllAppointmentsForReceptionist` wraps `GET /api/v1/appointments` with TanStack Query. The params object is serialised into query string parameters automatically.

---

### 2.6 Backend endpoint receives the request and checks auth

**File:** [backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistEndpoint.cs:10-29](backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistEndpoint.cs#L10-L29)

```csharp
group
  .MapGet(
    ApiEndpoints.Appointments.GetAllAppointments,
    async Task<Ok<PagedResult<ReceptionistAppointmentDto>>> (
      [AsParameters] GetAllAppointmentsForReceptionistQuery query,
      GetAllAppointmentsForReceptionistHandler handler,
      CancellationToken ct
    ) => {
      var appointments = await handler.HandleAsync(query, ct);
      return TypedResults.Ok(appointments);
    }
  )
  .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy);
```

| Line | What it does |
|------|-------------|
| 13–14 | Registers `GET /api/v1/appointments` — same URL also used by the admin view |
| 15 | Return type: `PagedResult<ReceptionistAppointmentDto>` — includes `items`, `totalCount`, `totalPages`, `hasNextPage`, `hasPreviousPage` |
| 27 | `AdminOrReceptionistPolicy` — both admin and receptionist can call this endpoint |

---

### 2.7 Handler applies all filters and paginates

**File:** [backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistHandler.cs:8-93](backend/src/TeleHealth.Api/Features/Appointments/GetAllAppointments/GetAllAppointmentsForReceptionistHandler.cs#L8-L93)

```csharp
private const int MaxPageSize = 50;

var q = db.Appointments.AsNoTracking();  // no patient filter — returns ALL appointments

q = query.View?.ToLowerInvariant() switch {
    "upcoming" => q.Where(a => a.DoctorSchedule.Date > now.Date || ...),
    "past"     => q.Where(a => a.DoctorSchedule.Date < now.Date || ...),
    _ => q,
};

if (!string.IsNullOrWhiteSpace(query.Search)) {
    var pattern = $"%{query.Search}%";
    q = q.Where(a =>
        EF.Functions.ILike(a.Doctor.User.FirstName + " " + a.Doctor.User.LastName, pattern)
        || EF.Functions.ILike(a.Patient.User.FirstName + " " + a.Patient.User.LastName, pattern)
        || EF.Functions.ILike(a.VisitReason, pattern)
    );
}
```

| Line | What it does |
|------|-------------|
| 10 | `MaxPageSize = 50` — server clamps so a client can't request unlimited rows |
| 17–18 | `page` and `pageSize` are clamped to safe values |
| 22 | Starts from all appointments — unlike the doctor view, there is no filter by treating doctor |
| 24–35 | Optional `view` filter: `"upcoming"` / `"past"` based on current UTC time |
| 37–47 | Optional `status`, `DoctorId`, `From`, `To` date filters — all additive (AND logic) |
| 49–60 | `ILike` search — case-insensitive PostgreSQL LIKE across doctor name, patient name, and visit reason simultaneously |
| 62–66 | Sort by date and time, ascending or descending based on `SortOrder` |
| 70–89 | `.Skip().Take()` for pagination, then projects into `ReceptionistAppointmentDto` with `statusColorCode` |

---

### 2.8 Response reaches the component → table renders each row

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:93-201](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L93-L201)

The `columns` array defines six columns for the TanStack Table:

| Column | What it renders |
|--------|----------------|
| Patient | 28 px avatar circle (photo or initials) + full name in medium weight |
| Doctor | Avatar circle + name on top line + specialization in muted text below |
| Date | Monospace date string |
| Time | `startTime – endTime` in monospace |
| Status | Rounded pill with `statusColorCode` as border + background tint + dot + status name |
| Actions | Three icon buttons: Eye (view), Pencil (edit), Bell (remind) |

The status pill at lines 164–185 uses `statusColorCode` from the backend to colour itself dynamically — no hardcoded colour mapping exists on the frontend.

---

### 2.9 Receptionist clicks the Bell icon → sends a reminder email

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:41-86](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L41-L86)

```tsx
function ActionsCell({ row }) {
  const { mutateAsync: sendReminder, isPending: isSending } = useRemindPatient();
  const isTerminal = TERMINAL_SLUGS.includes(row.original.statusSlug ?? "");

  return (
    <button
      disabled={isSending || isTerminal}
      onClick={async () => {
        await sendReminder({ id: row.original.publicId ?? "" });
        toast.success(`Reminder sent to ${row.original.patientName}.`);
      }}
    >
      {isSending ? <Spinner /> : <BellRing />}
    </button>
  );
}
```

| Line | What it does |
|------|-------------|
| 42 | `useRemindPatient()` — orval-generated mutation that fires `POST /api/v1/appointments/{id}/remind` |
| 43 | `isTerminal` — if the appointment is Completed, Cancelled, or No-Show, the bell button is disabled |
| 69–73 | On click: calls `sendReminder`, waits for success, shows a Sonner toast. On failure: shows an error toast |
| 79–83 | While sending, the bell icon swaps to a spinner so the receptionist knows the email is in flight |

**Backend endpoint:**

**File:** [backend/src/TeleHealth.Api/Features/Appointments/Remind/RemindPatientEndpoint.cs:11-12](backend/src/TeleHealth.Api/Features/Appointments/Remind/RemindPatientEndpoint.cs#L11-L12)

`POST api/v1/appointments/{id:guid}/remind` — auth: `ReceptionistPolicy`. Returns `204 NoContent` on success, `404 NotFound` if the appointment does not exist.

**Backend handler:**

**File:** [backend/src/TeleHealth.Api/Features/Appointments/Remind/RemindPatientHandler.cs:9-58](backend/src/TeleHealth.Api/Features/Appointments/Remind/RemindPatientHandler.cs#L9-L58)

```csharp
var appointment = await db.Appointments
    .Include(a => a.Patient).ThenInclude(p => p.User)
    .Include(a => a.DoctorSchedule)
    .FirstOrDefaultAsync(a => a.PublicId == id, ct);

var senderEmail = Environment.GetEnvironmentVariable("SES_SENDER_EMAIL") ?? string.Empty;
var sesRegion   = Environment.GetEnvironmentVariable("SES_REGION") ?? "us-east-1";

await ses.SendEmailAsync(new SendEmailRequest {
    FromEmailAddress = senderEmail,
    Destination = new Destination { ToAddresses = [appointment.Patient.User.Email] },
    Content = new EmailContent { Simple = new Message {
        Subject = new Content { Data = "Appointment Reminder — TeleHealth Portal" },
        Body = new Body { Text = new Content { Data =
            $"Date: {appointment.DoctorSchedule.Date}\n"
            + $"Time: {appointment.DoctorSchedule.StartTime} – {appointment.DoctorSchedule.EndTime}"
        }}
    }}
}, ct);
```

| Line | What it does |
|------|-------------|
| 13–17 | Loads the appointment with the patient's email and the schedule times |
| 22–23 | Reads `SES_SENDER_EMAIL` and `SES_REGION` from environment variables — not hardcoded |
| 25–27 | Creates an `AmazonSimpleEmailServiceV2Client` pointed at the configured region |
| 29–55 | Sends the reminder email via AWS SES v2 with the appointment ID, date, time, and a note to arrive early |

Think of it like a post office — the receptionist puts a letter in the tray, AWS SES delivers it to the patient's email inbox.

---

### Full chain — Feature 2

```
appointments_.tsx             → /appointments route
ReceptionistApptPage.tsx:456  → useGetAllAppointmentsForReceptionist({ Page, Search, Status, ... })
appointments.ts               → GET /api/v1/appointments (polling every 3 s)
GetAllAppointmentsForReceptionistEndpoint.cs:27 → AdminOrReceptionistPolicy passes
GetAllAppointmentsForReceptionistHandler.cs:22  → base query, no patient filter
GetAllAppointmentsForReceptionistHandler.cs:49  → ILike search on doctor/patient/reason
GetAllAppointmentsForReceptionistHandler.cs:70  → Skip/Take, project to ReceptionistAppointmentDto
ReceptionistApptPage.tsx:480  → table renders 10 rows with status colour pills
ReceptionistAppointment.tsx:42 → [Bell] useRemindPatient → POST /api/v1/appointments/{id}/remind
RemindPatientHandler.cs:29    → AWS SES v2 sends reminder email to patient
```

---

## Feature 3 — Appointment Details

**What the user sees:** A two-column read-only view. Left: patient identity, visit reason, and symptoms with severity colour coding. Right: doctor info, date/time, and a live status badge. The page polls every 3 seconds so status changes appear automatically.

### Step-by-step flow

```
Eye icon click → navigate /appointments/{id}
→ ReceptionistApptDetailsPage mounts
→ useGetAppointmentByIdForReceptionist(id, polling) → GET /api/v1/appointments/{id}
→ Handler: includes Patient + Doctor + Schedule + Status + JSONB symptoms
← ReceptionistAppointmentDetailDto ← 2-column layout renders
```

---

### 3.1 User clicks the Eye icon → navigate to the detail page

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:47-53](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L47-L53)

```tsx
<Link
  to="/appointments/$id"
  params={{ id: row.original.publicId ?? "" }}
>
  <Eye className="size-3.5" />
</Link>
```

TanStack Router's `<Link>` is type-safe — `to="/appointments/$id"` matches the registered route and `params.id` is required by the type system.

---

### 3.2 Component mounts, reads the ID from the URL, and starts polling

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointmentDetails.tsx:47-54](frontend/src/features/appointments/roles/ReceptionistAppointmentDetails.tsx#L47-L54)

```tsx
export function ReceptionistApptDetailsPage() {
  const { id } = useParams({ from: "/_protected/appointments/$id" });
  const { data, isLoading, isError } = useGetAppointmentByIdForReceptionist(id, {
    query: {
      refetchInterval: POLL_INTERVAL_MS,   // 3 000 ms
      refetchIntervalInBackground: false,
    },
  });
```

| Line | What it does |
|------|-------------|
| 48 | `useParams` extracts `id` from the URL — typed to exactly the `/_protected/appointments/$id` route |
| 49–54 | `useGetAppointmentByIdForReceptionist(id, ...)` — orval hook fires `GET /api/v1/appointments/{id}` every 3 seconds |
| `refetchIntervalInBackground: false` | Stops polling when the browser tab is hidden — saves network requests |

---

### 3.3 Backend endpoint receives the request

**File:** [backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentsById/ReceptionistGetAppointmentByIdEndpoint.cs:11-31](backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentsById/ReceptionistGetAppointmentByIdEndpoint.cs#L11-L31)

```csharp
group.MapGet(
    ApiEndpoints.Appointments.GetById,
    async Task<Results<Ok<ReceptionistAppointmentDetailDto>, NotFound>> (
        Guid id,
        ReceptionistGetAppointmentByIdHandler handler,
        CancellationToken ct
    ) => {
        var appointment = await handler.HandleAsync(id, ct);
        return appointment is null ? TypedResults.NotFound() : TypedResults.Ok(appointment);
    }
)
.RequireAuthorization(AuthConstants.ReceptionistPolicy);
```

`GET api/v1/appointments/{id:guid}` — auth: `ReceptionistPolicy`. Returns `200 OK` with the full detail DTO, or `404 Not Found` if the appointment doesn't exist.

---

### 3.4 Handler loads full appointment detail including JSONB symptoms

**File:** [backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentsById/ReceptionistGetAppointmentByIdHandler.cs:15-64](backend/src/TeleHealth.Api/Features/Appointments/GetAppointmentsById/ReceptionistGetAppointmentByIdHandler.cs#L15-L64)

```csharp
var appointment = await db.Appointments.AsNoTracking()
    .Include(a => a.Patient).ThenInclude(p => p.User)
    .Include(a => a.Doctor).ThenInclude(d => d.User)
    .Include(a => a.DoctorSchedule)
    .Include(a => a.AppointmentStatus)
    .Where(a => a.PublicId == id)
    .FirstOrDefaultAsync(ct);

// Read symptoms directly from the JSONB column to avoid EF Core naming convention mismatch
var symptomsJson = await db.Database.SqlQuery<string>(
    $"SELECT symptoms::text AS \"Value\" FROM appointments WHERE public_id = {id}"
).FirstOrDefaultAsync(ct);

var symptoms = symptomsJson is null
    ? null
    : JsonSerializer.Deserialize<List<Symptom>>(symptomsJson, JsonOptions);
```

| Line | What it does |
|------|-------------|
| 17–26 | Loads the appointment with four `Include()` chains — Patient.User, Doctor.User, DoctorSchedule, AppointmentStatus |
| 32–36 | Reads the `symptoms` PostgreSQL JSONB column via raw SQL because EF Core's column name convention doesn't match the JSON property names in this case |
| 38–40 | Deserialises the raw JSON string into `List<Symptom>` with case-insensitive matching |
| 42–63 | Builds and returns `ReceptionistAppointmentDetailDto` with all patient, doctor, schedule, status, and symptom fields |

---

### 3.5 Component renders the two-column layout

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointmentDetails.tsx:63-65](frontend/src/features/appointments/roles/ReceptionistAppointmentDetails.tsx#L63-L65)

```tsx
<motion.div className="grid grid-cols-2 gap-5 max-w-4xl" variants={container}>
  {/* LEFT — Patient */}
  {/* RIGHT — Doctor & Schedule */}
```

**Left column (patient card):**

| Lines | What it shows |
|-------|--------------|
| 71–104 | Patient avatar (photo or initials) + full name + IC number |
| 109–121 | Visit reason label + text |
| 124–156 | Symptoms list — each symptom has a colour dot driven by `severityColor()`: `"severe"/"high"` → red (`#ef4444`), `"moderate"/"medium"` → amber (`#f59e0b`), anything else → green (`#22c55e`) |

**Right column (doctor & schedule card):**

| Lines | What it shows |
|-------|--------------|
| 168–195 | Doctor avatar + full name + specialization |
| 200–218 | Date and time fields |
| 223–239 | Status badge — coloured border + background tint from `statusColorCode`, updates every 3 s via polling |

Think of it like a hospital chart clipped to a bed — patient info on one side, doctor assignment and current status on the other, and the nurse (receptionist) can see everything at a glance.

---

### Full chain — Feature 3

```
ReceptionistAppointment.tsx:48   → <Link to="/appointments/$id"> Eye icon click
ReceptionistAppointmentDetails.tsx:48 → useParams extracts id from URL
ReceptionistAppointmentDetails.tsx:49 → useGetAppointmentByIdForReceptionist(id, refetchInterval: 3000)
appointments.ts                  → GET /api/v1/appointments/{id}
ReceptionistGetAppointmentByIdEndpoint.cs:28 → ReceptionistPolicy check
ReceptionistGetAppointmentByIdHandler.cs:17  → loads Patient + Doctor + Schedule + Status
ReceptionistGetAppointmentByIdHandler.cs:32  → raw SQL reads JSONB symptoms
ReceptionistGetAppointmentByIdHandler.cs:42  → maps to ReceptionistAppointmentDetailDto
ReceptionistAppointmentDetails.tsx:65        → 2-column grid: patient card + doctor card
```

---

## Feature 4 — Edit Appointment

**What the user sees:** A two-column edit form. Left side shows patient info (read-only). Right side has editable fields: appointment status (dropdown) and schedule slot. If the appointment is in a terminal state (Completed, Cancelled, No-Show), all fields are disabled. Saving sends a `PUT` request.

### Step-by-step flow

```
Pencil icon click → navigate /appointments/edit/{id}
→ ReceptionistEditAppointment mounts
→ useGetAppointmentByIdForReceptionist (polling) → GET /api/v1/appointments/{id}
← current data renders in the edit form
[Save] → useUpdateAppointmentByReceptionist → PUT /api/v1/appointments/{id}
       → ValidationFilter → UpdateAppointmentByReceptionistValidator
       → UpdateAppointmentByReceptionistHandler (DB transaction)
       → free old slot, book new slot, store cancellation reason
       → SaveChangesAsync → CommitAsync
← 204 NoContent ← frontend invalidates query cache ← detail page refreshes
```

---

### 4.1 User clicks the Pencil icon

**File:** [frontend/src/features/appointments/roles/ReceptionistAppointment.tsx:54-59](frontend/src/features/appointments/roles/ReceptionistAppointment.tsx#L54-L59)

```tsx
<Link
  to="/appointments/edit/$id"
  params={{ id: row.original.publicId ?? "" }}
>
  <Pencil className="size-3.5" />
</Link>
```

TanStack Router navigates to `/appointments/edit/{publicId}`.

---

### 4.2 Component checks terminal status and starts polling

**File:** [frontend/src/features/appointments/roles/ReceptionistEditAppointment.tsx:1-58](frontend/src/features/appointments/roles/ReceptionistEditAppointment.tsx#L1-L58)

```tsx
const TERMINAL_SLUGS = ["cancelled", "completed", "no-show"];

export function ReceptionistApptEditPage() {
  const { id } = useParams({ from: "/_protected/appointments/edit/$id" });

  const { data } = useGetAppointmentByIdForReceptionist(id, {
    query: { refetchInterval: 3_000, refetchIntervalInBackground: false },
  });

  const appt = data?.status === 200 ? data.data : null;
  const isTerminal = TERMINAL_SLUGS.includes(appt?.statusSlug ?? "");

  return (
    <div className="grid grid-cols-2 gap-5 max-w-4xl">
      <PatientInfoCard appt={appt} />
      <AppointmentEditForm appt={appt} isTerminal={isTerminal} />
    </div>
  );
}
```

| Line | What it does |
|------|-------------|
| `TERMINAL_SLUGS` | Defines which statuses lock the form — `"cancelled"`, `"completed"`, `"no-show"` |
| `useGetAppointmentByIdForReceptionist` | Same hook as the detail page — keeps the form in sync with real-time status while open |
| `isTerminal` | Passed to `<AppointmentEditForm>` — disables all inputs and the Save button when `true` |
| `grid grid-cols-2` | Side-by-side layout — patient info on the left, editable form on the right |

---

### 4.3 Receptionist changes status or schedule slot and clicks Save

The `<AppointmentEditForm>` calls `useUpdateAppointmentByReceptionist()` on submit and sends:

```ts
PUT /api/v1/appointments/{id}
Body: { StatusSlug: "checked-in", SchedulePublicId: "...", CancellationReason?: "..." }
```

---

### 4.4 Backend validates the request body

**File:** [backend/src/TeleHealth.Api/Features/Appointments/UpdateAppointmentByIdForReceptionist/UpdateAppointmentByReceptionistValidator.cs:5-24](backend/src/TeleHealth.Api/Features/Appointments/UpdateAppointmentByIdForReceptionist/UpdateAppointmentByReceptionistValidator.cs#L5-L24)

```csharp
public sealed class UpdateAppointmentByReceptionistValidator
    : AbstractValidator<UpdateAppointmentByReceptionistCommand>
{
    public UpdateAppointmentByReceptionistValidator()
    {
        RuleFor(x => x.StatusSlug).NotEmpty();
        RuleFor(x => x.SchedulePublicId).NotEqual(Guid.Empty);
        When(x => x.StatusSlug == "cancelled", () => {
            RuleFor(x => x.CancellationReason)
                .NotEmpty()
                .WithMessage("Cancellation reason is required when cancelling an appointment.")
                .MaximumLength(500);
        });
    }
}
```

| Rule | What it enforces |
|------|----------------|
| `StatusSlug.NotEmpty()` | A status must always be provided |
| `SchedulePublicId.NotEqual(Guid.Empty)` | A schedule slot must be selected |
| `When(StatusSlug == "cancelled")` | If cancelling, a reason is required and capped at 500 characters |

The validator runs inside the `ValidationFilter<UpdateAppointmentByReceptionistCommand>` registered on the endpoint — it fires before the handler and returns `422 Unprocessable Entity` if any rule fails.

---

### 4.5 Handler runs the update inside a database transaction

**File:** [backend/src/TeleHealth.Api/Features/Appointments/UpdateAppointmentByIdForReceptionist/UpdateAppointmentByReceptionistHandler.cs:11-108](backend/src/TeleHealth.Api/Features/Appointments/UpdateAppointmentByIdForReceptionist/UpdateAppointmentByReceptionistHandler.cs#L11-L108)

```csharp
await using var transaction = await db.Database.BeginTransactionAsync(ct);
try {
    var appointment = await db.Appointments
        .Include(a => a.DoctorSchedule)
        .Include(a => a.AppointmentStatus)
        .FirstOrDefaultAsync(a => a.PublicId == appointmentPublicId, ct);

    var newStatus = await db.AppointmentStatuses
        .FirstOrDefaultAsync(s => s.Slug == cmd.StatusSlug, ct);

    var scheduleChanged = oldSchedule.PublicId != cmd.SchedulePublicId;

    if (scheduleChanged) {
        oldSchedule.StatusId = StatusId.Schedule.Available;   // free the old slot
        newSchedule.StatusId = StatusId.Schedule.Booked;      // claim the new slot
        appointment.ScheduleId = newSchedule.Id;
    }

    if (newStatus.Id == StatusId.Appointment.Cancelled) {
        appointment.CancellationReason = cmd.CancellationReason;
        if (!scheduleChanged) oldSchedule.StatusId = StatusId.Schedule.Available;
    }

    if (newStatus.Id == StatusId.Appointment.CheckedIn)
        appointment.CheckInDateTime = SystemClock.Instance.GetCurrentInstant();

    appointment.StatusId = newStatus.Id;
    await db.SaveChangesAsync(ct);
    await transaction.CommitAsync(ct);
}
catch (DbUpdateConcurrencyException) {
    await transaction.RollbackAsync(ct);
    throw new ScheduleSlotUnavailableException();   // 409 Conflict
}
catch { await transaction.RollbackAsync(ct); throw; }
```

| Line | What it does |
|------|-------------|
| 19 | Opens a DB transaction — all changes go in or all roll back |
| 23–26 | Loads the appointment with its current schedule and status |
| 37–40 | Looks up the new status by slug |
| 48–49 | Detects whether the schedule slot changed |
| 67–68 | If changed: marks old slot `Available` and new slot `Booked` in the same transaction |
| 75–81 | If cancelled: stores the cancellation reason and frees the slot |
| 83–84 | If checked-in: stamps `CheckInDateTime` with the current UTC instant |
| 88 | `SaveChangesAsync` — one round trip writes all changes |
| 89 | `CommitAsync` — makes the changes visible to other transactions |
| 97–100 | `DbUpdateConcurrencyException` means two receptionists tried to book the same slot simultaneously — returns `409 Conflict` |

Think of it like a hotel reservation desk — moving a guest to a different room requires freeing the old room and marking the new one as occupied in one atomic operation.

---

### Full chain — Feature 4

```
ReceptionistAppointment.tsx:55   → Pencil <Link to="/appointments/edit/$id">
ReceptionistEditAppointment.tsx  → useGetAppointmentByIdForReceptionist (polling)
appointments.ts                  → GET /api/v1/appointments/{id}  (loads current data)
AppointmentEditForm              → PUT /api/v1/appointments/{id}  (on Save)
UpdateAppointmentByReceptionistEndpoint.cs:27 → ReceptionistPolicy check
UpdateAppointmentByReceptionistValidator.cs   → StatusSlug required, CancellationReason when cancelled
UpdateAppointmentByReceptionistHandler.cs:19  → BeginTransactionAsync
UpdateAppointmentByReceptionistHandler.cs:67  → free old slot, book new slot
UpdateAppointmentByReceptionistHandler.cs:88  → SaveChangesAsync → CommitAsync
← 204 NoContent ← cache invalidated ← detail view refreshes
```

---

## Feature 5 — Patient Directory

**What the user sees:** A searchable paginated table of all registered patients with their IC number, contact info, blood group, and a View button.

### Step-by-step flow

```
Navigate /patients → Route → ReceptionistPatientsPage
    → search + pagination state (1 s debounce)
    → useReceptionistGetAllPatients → GET /api/v1/patients
    → Handler: ILike search, sort by LastName, Skip/Take
    ← PagedResult<ReceptionistPatientsDto> ← table renders
    [Eye icon] → navigate /patients/{patientPublicId}
```

---

### 5.1 Route + role dispatch

**File:** [frontend/src/routes/_protected/patients_.tsx](frontend/src/routes/_protected/patients_.tsx)

The `/patients` route is shared between roles. The receptionist role renders `<ReceptionistPatientsPage>` (non-doctor path). The doctor has a separate `<DoctorPatientsPage>` — see `doctor.md`.

---

### 5.2 Component initialises search + pagination state

**File:** [frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx:267-278](frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx#L267-L278)

```tsx
export function ReceptionistPatientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 1000);       // 1-second debounce — longer than appointments page (500 ms)
    return () => clearTimeout(timer);
  }, [searchInput]);
```

The 1-second debounce for patients (vs 500 ms for appointments) gives the receptionist more time to finish typing a name or IC number before the API is called.

---

### 5.3 Hook fires the HTTP request

**File:** [frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx:280-284](frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx#L280-L284)

```tsx
const { data, isLoading, isError } = useReceptionistGetAllPatients({
  Page: page,
  PageSize: PAGE_SIZE,    // 10
  Search: search || undefined,
});
```

No polling here — patient profiles don't change in real time, so a one-shot fetch on each state change is sufficient.

---

### 5.4 Backend endpoint

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForReceptionist/ReceptionistGetAllPatientsEndpoint.cs:13-14](backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForReceptionist/ReceptionistGetAllPatientsEndpoint.cs#L13-L14)

`GET api/v1/patients` — auth: `ReceptionistPolicy`. Returns `PagedResult<ReceptionistPatientsDto>`.

---

### 5.5 Handler searches, sorts, and paginates

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForReceptionist/ReceptionistGetAllPatientsHandler.cs:8-64](backend/src/TeleHealth.Api/Features/Patients/GetAllPatientsForReceptionist/ReceptionistGetAllPatientsHandler.cs#L8-L64)

```csharp
IQueryable<Patient> q = db.Patients.AsNoTracking().Include(p => p.User);

if (!string.IsNullOrWhiteSpace(query.Search)) {
    var pattern = $"%{query.Search}%";
    q = q.Where(p =>
        EF.Functions.ILike(p.User.FirstName + " " + p.User.LastName, pattern)
        || EF.Functions.ILike(p.User.Email, pattern)
        || EF.Functions.ILike(p.User.IcNumber, pattern)
    );
}

q = query.SortOrder?.ToLowerInvariant() == "desc"
    ? q.OrderByDescending(p => p.User.LastName)
    : q.OrderBy(p => p.User.LastName);

var rawItems = await q.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
```

| Line | What it does |
|------|-------------|
| 20 | Includes `User` — the patient entity stores clinical data while `User` stores personal details |
| 22–30 | ILike search spans three fields simultaneously: full name, email, and IC number |
| 32–35 | Sorts alphabetically by last name (ascending by default) |
| 41 | Fetches the page in memory first (needed for `EmergencyContact` wrapping which can't be done in EF expression trees) |
| 43–60 | Maps to `ReceptionistPatientsDto` — includes `BloodGroup`, `Allergies`, `EmergencyContacts` |

Think of it like a clinic filing cabinet — the receptionist can pull any patient's folder by searching name, email, or ID number.

---

### 5.6 Table renders each patient row

**File:** [frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx:23-109](frontend/src/features/patients/roles/ReceptionistPatientsPage.tsx#L23-L109)

| Column | What it renders |
|--------|----------------|
| Name | 28 px avatar circle (photo or initials) + first + last name |
| IC Number | Raw string |
| Email | Raw string |
| Phone | Raw string (or `—` if empty) |
| Date of Birth | Raw date string |
| Blood Group | Teal-tinted rounded badge (e.g. `O+`) |
| Actions | Eye icon → `<Link to="/patients/$id" params={{ id: patientPublicId }}>` |

---

### Full chain — Feature 5

```
patients_.tsx                    → /patients route, renders <ReceptionistPatientsPage>
ReceptionistPatientsPage.tsx:272 → 1-second debounced search state
ReceptionistPatientsPage.tsx:280 → useReceptionistGetAllPatients({ Page, PageSize, Search })
patients.ts                      → GET /api/v1/patients
ReceptionistGetAllPatientsEndpoint.cs → ReceptionistPolicy check
ReceptionistGetAllPatientsHandler.cs:22 → ILike search on name / email / IC
ReceptionistGetAllPatientsHandler.cs:41 → Skip/Take, map to ReceptionistPatientsDto
ReceptionistPatientsPage.tsx:23  → table renders 10 rows per page
ReceptionistPatientsPage.tsx:96  → Eye icon navigates to /patients/{patientPublicId}
```

---

## Feature 6 — Patient Details

**What the user sees:** A full patient profile card with avatar, name, contact info, blood group circle, allergies (with severity colours), and emergency contacts.

### Step-by-step flow

```
Eye icon click → navigate /patients/{id}
→ ReceptionistPatientDetailsPage mounts
→ useReceptionistGetPatientById(id) → GET /api/v1/patients/{id}
→ Handler: fetch Patient + User → DB
← ReceptionistPatientsDto ← hero card + info grid + emergency contacts render
["View Appointment History"] → navigate /patients/{id}/appointments
```

---

### 6.1 Component fetches the patient by public ID

**File:** [frontend/src/features/patients/roles/ReceptionistPatientDetailsPage.tsx:47](frontend/src/features/patients/roles/ReceptionistPatientDetailsPage.tsx#L47)

```tsx
const { data: patientData, isLoading, isError } = useReceptionistGetPatientById(id);
```

No polling — patient profile data is static and only changes when the patient updates it themselves.

---

### 6.2 Backend endpoint

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetPatientByIdForReceptionist/ReceptionistGetPatientByIdEndpoint.cs:13-14](backend/src/TeleHealth.Api/Features/Patients/GetPatientByIdForReceptionist/ReceptionistGetPatientByIdEndpoint.cs#L13-L14)

`GET api/v1/patients/{id:guid}` — auth: `ReceptionistPolicy`. Returns `200 OK` with `ReceptionistPatientsDto`, or `404 Not Found`.

---

### 6.3 Handler fetches the full patient record

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetPatientByIdForReceptionist/ReceptionistGetPatientByIdHandler.cs:14-38](backend/src/TeleHealth.Api/Features/Patients/GetPatientByIdForReceptionist/ReceptionistGetPatientByIdHandler.cs#L14-L38)

The handler fetches the patient by `PatientPublicId`, includes `User`, and maps to the same `ReceptionistPatientsDto` used in the directory listing. This DTO includes `Allergies` (a list with name and severity) and `EmergencyContacts`.

---

### 6.4 Component renders the full profile

**File:** [frontend/src/features/patients/roles/ReceptionistPatientDetailsPage.tsx:78-284](frontend/src/features/patients/roles/ReceptionistPatientDetailsPage.tsx#L78-L284)

**Hero card (lines 78–162):**

| Lines | What it shows |
|-------|--------------|
| 92–102 | Avatar with gradient background — photo if `avatarUrl` exists, otherwise a generated coloured circle with initials |
| 106–128 | Patient name in large text + contact info (email, phone) |
| 131–139 | "View Appointment History" button → navigates to `/patients/{id}/appointments` |
| 142–159 | Blood group displayed in a circular teal badge in the top-right corner |

**Info grid (lines 165–249):**

| Lines | What it shows |
|-------|--------------|
| 167–202 | Personal Information card: IC Number, Date of Birth, Email, Phone |
| 204–249 | Allergies card: each allergy shows its name and a severity colour chip (red for Severe, amber for Moderate, green for Mild) |

**Emergency contacts (lines 252–284):** Conditionally rendered — only shown if the patient has at least one emergency contact. Each contact displays name, relationship, and phone with a shield icon.

---

### Full chain — Feature 6

```
ReceptionistPatientsPage.tsx:96       → Eye icon, navigates /patients/{patientPublicId}
ReceptionistPatientDetailsPage.tsx:47 → useReceptionistGetPatientById(id)
patients.ts                           → GET /api/v1/patients/{id}
ReceptionistGetPatientByIdEndpoint.cs → ReceptionistPolicy check
ReceptionistGetPatientByIdHandler.cs:14 → fetch Patient + User by PatientPublicId
← ReceptionistPatientsDto ← hero card + info grid + emergency contacts render
ReceptionistPatientDetailsPage.tsx:131 → "View Appointment History" → /patients/{id}/appointments
```

---

## Feature 7 — Patient Appointment History

**What the user sees:** A chronological list of all past appointments for one patient. Each appointment is an expandable card showing the date, doctor, status, and — when expanded — the SOAP consultation notes and any prescriptions.

### Step-by-step flow

```
"View Appointment History" click → navigate /patients/{id}/appointments
→ ReceptionistCheckPatientHistory mounts
→ useReceptionistGetPatientHistory(id) → GET /api/v1/patients/{id}/appointments
→ Handler: fetch patient name + all appointments with Consultation + Prescriptions (eager)
← ReceptionistPatientHistoryResponse ← expandable appointment cards render
```

---

### 7.1 Component fetches history for the patient

**File:** [frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx:279](frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx#L279)

```tsx
const { data, isLoading, isError } = useReceptionistGetPatientHistory(id);
```

No polling — history is append-only and doesn't change during a session.

---

### 7.2 Backend endpoint

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetPatientHistoryForReceptionist/ReceptionistGetPatientHistoryEndpoint.cs:12-13](backend/src/TeleHealth.Api/Features/Patients/GetPatientHistoryForReceptionist/ReceptionistGetPatientHistoryEndpoint.cs#L12-L13)

`GET api/v1/patients/{id:guid}/appointments` — auth: `ReceptionistPolicy`. Returns `ReceptionistPatientHistoryResponse` (patient name + list of appointments), or `404 Not Found` if the patient doesn't exist.

---

### 7.3 Handler loads all appointments with nested consultation data

**File:** [backend/src/TeleHealth.Api/Features/Patients/GetPatientHistoryForReceptionist/ReceptionistGetPatientHistoryHandler.cs:9-94](backend/src/TeleHealth.Api/Features/Patients/GetPatientHistoryForReceptionist/ReceptionistGetPatientHistoryHandler.cs#L9-L94)

```csharp
var patient = await db.Patients.AsNoTracking()
    .Where(p => p.PublicId == patientPublicId)
    .Select(p => new { p.Id, p.User.FirstName, p.User.LastName })
    .FirstOrDefaultAsync(ct);

var appointments = await db.Appointments
    .Include(a => a.DoctorSchedule)
    .Include(a => a.AppointmentStatus)
    .Include(a => a.Doctor).ThenInclude(d => d.User)
    .Include(a => a.Consultation).ThenInclude(c => c.Prescriptions)
    .Where(a => a.PatientId == patient.Id)
    .OrderByDescending(a => a.DoctorSchedule.Date)
    .ThenByDescending(a => a.DoctorSchedule.StartTime)
    .ToListAsync(ct);
```

| Line | What it does |
|------|-------------|
| 14–23 | Fetches only `Id`, `FirstName`, `LastName` for the patient — nothing else is needed at this stage |
| 28–38 | Loads all appointments for that patient with four `Include()` chains: Schedule, Status, Doctor.User, and Consultation with Prescriptions eagerly loaded in one query |
| 36–38 | Orders by date descending then time descending — most recent appointment at the top |
| 40–86 | Maps each appointment: if a `Consultation` exists, maps its SOAP notes (`Subjective`, `Objective`, `Assessment`, `Plan`), follow-up date, and a list of `PrescriptionSummaryDto` |
| 88–92 | Wraps into `ReceptionistPatientHistoryResponse { PatientName, Items }` |

---

### 7.4 Component renders expandable appointment cards

**File:** [frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx:161-275](frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx#L161-L275)

Each appointment renders as a card with:

| Lines | What it shows |
|-------|--------------|
| 190–200 | Date block — large day number + month + year |
| 207–218 | Doctor name + specialization |
| 226–237 | Status badge coloured by `statusColorCode` |
| 247–270 | Expanded body: `ConsultationSection` (SOAP notes + follow-up) + prescriptions list |

The card is clickable — clicking toggles an `isExpanded` state to show or hide the consultation section.

---

### 7.5 Prescription card detail

**File:** [frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx:24-85](frontend/src/features/patients/roles/ReceptionistCheckPatientHistory.tsx#L24-L85)

Each prescription shows:
- Medication name and dosage
- Duration in days + frequency (e.g. "twice daily")
- Storage instructions (e.g. "keep refrigerated")
- Missed-dose guidance
- Warnings list (shown in amber if present)

---

### Full chain — Feature 7

```
ReceptionistPatientDetailsPage.tsx:131 → "View Appointment History" → /patients/{id}/appointments
ReceptionistCheckPatientHistory.tsx:279 → useReceptionistGetPatientHistory(id)
patients.ts                             → GET /api/v1/patients/{id}/appointments
ReceptionistGetPatientHistoryEndpoint.cs → ReceptionistPolicy check
ReceptionistGetPatientHistoryHandler.cs:14 → fetch patient name
ReceptionistGetPatientHistoryHandler.cs:28 → load appointments with Consultation + Prescriptions
ReceptionistGetPatientHistoryHandler.cs:40 → map to ReceptionistPatientAppointmentDto[]
← ReceptionistPatientHistoryResponse ← expandable cards render most-recent first
```

---

## Feature 8 — Receptionist Profile Management

**What the user sees:** A profile page showing the receptionist's own details. Clicking "Edit Profile" makes the name, phone, and IC fields editable. Saving sends a `PATCH`. The avatar can be changed at any time without entering edit mode — the new photo uploads directly to S3 and the sidebar updates instantly.

### Step-by-step flow

```
Navigate /profile → Route (role dispatch) → ReceptionistProfilePage
    → UseReceptionistProfile hook → fetchReceptionistProfile() → GET /api/v1/users/me/receptionist
    ← profile data fills the form

[Edit → Save]
    → validateForm() (client-side: name / phone / IC regexes)
    → patchProfile() → PATCH /api/v1/users/me/receptionist
    → UpdateReceptionistProfileHandler: check duplicate IC → raw SQL UPDATE → DB
    ← 200 OK ← form exits edit mode

[Upload avatar]
    → fetchAvatarUploadUrl() → GET /api/v1/users/me/avatar/upload-url
    ← presigned S3 PUT URL (backend generates, valid ~60 s)
    → PUT file to S3 directly (no backend involved in the upload itself)
    → patchAvatarUrl() → PATCH /api/v1/users/me/avatar (saves the new URL in the DB)
    → setAvatarUrl(cacheBustedUrl) → Zustand store → sidebar photo updates immediately
```

---

### 8.1 Route dispatches to the receptionist profile page

**File:** [frontend/src/routes/_protected/profile.tsx:19](frontend/src/routes/_protected/profile.tsx#L19)

```tsx
case "receptionist": return <ReceptionistProfilePage />;
```

The `/profile` route is shared between all roles. The role string from the Zustand auth store determines which profile component renders.

---

### 8.2 Hook fetches current profile on mount

**File:** [frontend/src/features/profile/UseReceptionistProfile.tsx:63-67](frontend/src/features/profile/UseReceptionistProfile.tsx#L63-L67)

```ts
async function fetchReceptionistProfile(): Promise<ReceptionistMeData> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/receptionist`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json() as Promise<ReceptionistMeData>;
}
```

Uses a plain `fetch` (not orval) with `credentials: "include"` so the JWT cookie is sent. On success, the response is used to pre-populate the form fields.

---

### 8.3 Profile data fills the form fields

**File:** [frontend/src/features/profile/UseReceptionistProfile.tsx:124-137](frontend/src/features/profile/UseReceptionistProfile.tsx#L124-L137)

```ts
useEffect(() => {
  fetchReceptionistProfile()
    .then((data) => {
      setMe(data);
      setFormData({
        firstName: data.firstName,
        lastName:  data.lastName,
        phone:     data.phone ?? "",
        icNumber:  data.icNumber,
      });
    })
    .catch(() => toast.error("Failed to load profile"))
    .finally(() => setIsLoading(false));
}, []);
```

The `useEffect` runs once on mount. `setMe` stores the full profile (used to display read-only fields like email and role badge). `setFormData` seeds the editable fields.

---

### 8.4 Backend GET endpoint returns the profile

**File:** [backend/src/TeleHealth.Api/Features/Users/ReceptionistProfile/GetReceptionistProfileEndpoint.cs:14-46](backend/src/TeleHealth.Api/Features/Users/ReceptionistProfile/GetReceptionistProfileEndpoint.cs#L14-L46)

```csharp
group.MapGet(
    ApiEndpoints.Users.GetReceptionistProfile,
    async (ClaimsPrincipal user, ApplicationDbContext db, CancellationToken ct) => {
        var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(publicIdString, out var publicId))
            return Results.Unauthorized();

        var profile = await db.Users.AsNoTracking()
            .Include(u => u.Roles)
            .Where(u => u.PublicId == publicId)
            .Select(u => new {
                u.PublicId, u.Email, u.FirstName, u.LastName,
                u.AvatarUrl, u.Phone, u.IcNumber,
                Roles = u.Roles.Select(r => r.Slug).ToList(),
            })
            .FirstOrDefaultAsync(ct);

        return profile is not null ? Results.Ok(profile) : Results.NotFound();
    }
)
.RequireAuthorization(AuthConstants.ReceptionistPolicy);
```

| Line | What it does |
|------|-------------|
| 18–20 | Reads `NameIdentifier` claim from the JWT — this is the `publicId` of the logged-in user |
| 22–38 | Queries the user with roles, returns only the fields needed by the profile page |
| 40 | Returns `200 OK` with the profile or `404 Not Found` |
| 45 | `ReceptionistPolicy` — only the receptionist themselves can read their own profile |

---

### 8.5 Receptionist clicks "Edit Profile" → fields become editable

**File:** [frontend/src/features/profile/UseReceptionistProfile.tsx:169-179](frontend/src/features/profile/UseReceptionistProfile.tsx#L169-L179)

```ts
function handleEdit() {
  if (!me) return;
  setFormData({ firstName: me.firstName, lastName: me.lastName,
                phone: me.phone ?? "", icNumber: me.icNumber });
  setFormErrors({});
  setIsEditing(true);
}
```

`handleEdit` re-seeds `formData` from the current `me` state (ensures the form starts from the saved values, not a stale edit) and sets `isEditing = true`. The UI in `ReceptionistProfilePage.tsx` conditionally renders `<Input>` fields when `isEditing` is true and plain `<span>` text when false.

---

### 8.6 Receptionist clicks Save → client validates then sends PATCH

**File:** [frontend/src/features/profile/UseReceptionistProfile.tsx:193-222](frontend/src/features/profile/UseReceptionistProfile.tsx#L193-L222)

```ts
const NAME_RE  = /^[a-zA-Z ]+$/;
const PHONE_RE = /^\d{10}$/;
const IC_RE    = /^\d{12}$/;

async function handleSave() {
  const errors = validateForm(formData);
  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }
  setIsSaving(true);
  try {
    await patchProfile(formData);   // → PATCH /api/v1/users/me/receptionist
    setMe((prev) => prev ? { ...prev, ...formData } : prev);
    setIsEditing(false);
    toast.success("Profile updated successfully");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to save profile");
  }
}
```

| Rule | What it checks |
|------|--------------|
| `NAME_RE` | First/last name may only contain letters and spaces, max 20 characters |
| `PHONE_RE` | Phone must be exactly 10 digits (`\d{10}`) |
| `IC_RE` | IC number must be exactly 12 digits (`\d{12}`) |

`patchProfile` sends `PATCH /api/v1/users/me/receptionist` with `{ firstName, lastName, phone, icNumber }`.

---

### 8.7 Backend PATCH handler validates IC uniqueness and updates the DB

**File:** [backend/src/TeleHealth.Api/Features/Users/ReceptionistProfile/UpdateReceptionistProfileHandler.cs:9-74](backend/src/TeleHealth.Api/Features/Users/ReceptionistProfile/UpdateReceptionistProfileHandler.cs#L9-L74)

```csharp
var currentIcNumber = await db.Users.AsNoTracking()
    .Where(u => u.PublicId == publicId)
    .Select(u => (string?)u.IcNumber)
    .FirstOrDefaultAsync(ct);

if (!string.Equals(currentIcNumber, cmd.IcNumber, StringComparison.Ordinal)
    && await db.Users.AnyAsync(
        u => u.IcNumber == cmd.IcNumber && u.PublicId != publicId && u.DeletedAt == null, ct))
{
    throw new DuplicateIcNumberException();
}

await db.Database.ExecuteSqlInterpolatedAsync($"""
    UPDATE users
    SET first_name = {cmd.FirstName},
        last_name  = {cmd.LastName},
        phone      = {phone},
        ic_number  = {cmd.IcNumber},
        updated_at = now()
    WHERE public_id  = {publicId}
      AND deleted_at IS NULL
    """, ct);
```

| Line | What it does |
|------|-------------|
| 19–23 | Fetches the current IC number from the DB to compare |
| 28–34 | If the IC changed, checks that no other active user already has the same IC — throws `DuplicateIcNumberException` (mapped to `409 Conflict`) if so |
| 41–54 | Uses a raw SQL interpolated query (parameterised, safe from SQL injection) to update four columns in one round trip |

Think of it like a national ID registry — two people can't share the same IC number, so the system checks before allowing the change.

---

### 8.8 Avatar upload flow (runs separately, no edit mode required)

**File:** [frontend/src/features/profile/UseReceptionistProfile.tsx:139-167](frontend/src/features/profile/UseReceptionistProfile.tsx#L139-L167)

```ts
async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  try {
    const { uploadUrl, publicUrl } = await fetchAvatarUploadUrl(file.type);
    // → GET /api/v1/users/me/avatar/upload-url?contentType=image/jpeg

    const s3Res = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    // ↑ browser PUT directly to S3 — backend not involved in the upload

    const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
    await patchAvatarUrl(cacheBustedUrl);
    // → PATCH /api/v1/users/me/avatar  — saves the new URL in the DB

    setMe((prev) => prev ? { ...prev, avatarUrl: cacheBustedUrl } : prev);
    setAvatarUrl(cacheBustedUrl);   // → updates Zustand store → sidebar photo refreshes
    toast.success("Profile photo updated");
  }
}
```

| Step | What happens |
|------|-------------|
| `fetchAvatarUploadUrl(file.type)` | Backend generates a time-limited presigned S3 `PUT` URL and a permanent `publicUrl` |
| `fetch(uploadUrl, { method: "PUT", body: file })` | Browser sends the image file straight to S3 — the backend never touches the binary data |
| `cacheBustedUrl = publicUrl + ?t=timestamp` | Appends a timestamp so the browser re-downloads the image instead of serving the stale cached version |
| `patchAvatarUrl(cacheBustedUrl)` | Saves the new URL into the `users.avatar_url` column in PostgreSQL |
| `setAvatarUrl(cacheBustedUrl)` | Updates the Zustand auth store so the sidebar avatar changes immediately without a page reload |

Think of it like a self-service photo kiosk at a company office — you hand the image directly to the storage room (S3) and only tell the front desk (backend) where the new photo is stored, not the photo itself.

---

### Full chain — Feature 8

```
profile.tsx:19                      → case "receptionist": renders <ReceptionistProfilePage />
UseReceptionistProfile.tsx:124      → fetchReceptionistProfile() → GET /api/v1/users/me/receptionist
GetReceptionistProfileEndpoint.cs:18 → reads publicId from JWT claims
GetReceptionistProfileEndpoint.cs:22 → queries DB for user + roles
← profile data pre-populates formData

[Save]
UseReceptionistProfile.tsx:193      → validateForm() — NAME_RE, PHONE_RE, IC_RE
UseReceptionistProfile.tsx:202      → patchProfile() → PATCH /api/v1/users/me/receptionist
UpdateReceptionistProfileHandler.cs:28 → duplicate IC check
UpdateReceptionistProfileHandler.cs:41 → raw SQL UPDATE users SET first_name, last_name, phone, ic_number
← 200 OK ← setIsEditing(false) ← toast.success

[Upload avatar]
UseReceptionistProfile.tsx:146      → fetchAvatarUploadUrl() → GET presigned S3 URL
UseReceptionistProfile.tsx:148      → fetch(uploadUrl, PUT, file) → S3 direct upload
UseReceptionistProfile.tsx:157      → patchAvatarUrl(cacheBustedUrl) → PATCH /api/v1/users/me/avatar → DB
UseReceptionistProfile.tsx:160      → setAvatarUrl(cacheBustedUrl) → Zustand → sidebar updates instantly
```
