# Patient Feature — Full Reference Guide

> For presentation use. Covers every patient feature end-to-end: Route → Frontend → API Client → Backend Endpoint → Handler → Database. AWS SNS → Lambda → SES is included for appointment notifications.

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
                                                       [MassTransit → SNS → Lambda → SES (email notifications)]
```

**Tech stack:**
- **Frontend:** React 19 + TypeScript, TanStack Router, TanStack Query, shadcn/ui, Framer Motion, Zustand
- **Backend:** ASP.NET Core (.NET 10), Minimal API, EF Core, NodaTime, MassTransit (SNS publisher)
- **DB:** PostgreSQL (NodaTime `LocalDate`, `LocalTime`)
- **Messaging:** AWS SNS + Lambda + SES (appointment notifications)

---

## Feature 0 — Login → Patient Dashboard

**What the user sees:** Patient types email + password → clicks Login → lands on the patient dashboard with their name in the greeting, stat cards showing appointment counts, and a mini table of upcoming visits.

**Steps 1–6 (login form → backend JWT → getMe → Zustand auth store → navigate `/dashboard` → role dispatch) are identical to the doctor flow documented in `doctor.md` Feature 0.** The same login mechanism, JWT cookie, `getMe` orval-generated client, `useAuthStore` (Zustand), and `pickPrimaryRole` dispatch are used for all roles. The only difference is what renders after the dispatch.

---

### Step 7 — Dashboard reads the role from the store → shows the patient dashboard

**File:** [frontend/src/features/dashboard/Dashboard.tsx:14-29](frontend/src/features/dashboard/Dashboard.tsx#L14-L29)

```tsx
switch (user?.role?.toLowerCase()) {
  case "patient":      return <PatientDashboard />;
  case "receptionist": return <ReceptionistDashboard />;
  case "doctor":       return <DoctorDashboard />;
  case "admin":        return <AdminDashboard />;
  case "lab-tech":     return <LabTechDashboard />;
}
```

When `user.role` is `"patient"`, React renders `<PatientDashboard />`. The greeting at [Dashboard.tsx:36-43](frontend/src/features/dashboard/Dashboard.tsx#L36-L43) uses `user.firstName` from the same Zustand store — `"Good afternoon, Sarah"`.

---

### Step 8 — AppShell reads name + avatar from store → shows in sidebar

**File:** [frontend/src/components/layout/AppShell.tsx:108-115](frontend/src/components/layout/AppShell.tsx#L108-L115)

```tsx
const { user, logout } = useAuthStore();

const normalizedRole = user?.role?.toLowerCase();
const userInitial = user?.firstName?.charAt(0).toUpperCase() ?? "U";
const avatarUrl = user?.avatarUrl;
```

The sidebar and header both display the patient's first-name initial (or avatar photo if uploaded). The dropdown menu at [AppShell.tsx:174-185](frontend/src/components/layout/AppShell.tsx#L174-L185) adds a **"My Profile"** link that navigates to `/patients/{publicId}/medical-profile` — only visible when `normalizedRole === "patient"`.

---

### Bonus — Page refresh restores session

Same `__root.tsx:9-30` pattern as doctor.md: `beforeLoad` calls `getMe()` silently and repopulates the Zustand store before any protected route renders. If the cookie expired, protected routes redirect to `/login`.

---

### Full chain — one line each

```
useLoginForm.ts:26       → POST /auth/login
LoginHandler.cs:42       → verifies password, writes JWT cookie with role embedded
useLoginForm.ts:27       → calls getMe() (orval-generated function)
users.ts:173             → GET /api/v1/me (cookie attached automatically)
GetMeEndpoint.cs:46-70   → reads JWT, queries DB, returns { firstName, role: "patient", avatarUrl }
useLoginForm.ts:44-51    → setAuth() → saves into useAuthStore.ts (Zustand)
useAuthStore.ts:22       → holds { role, firstName, avatarUrl } in memory for the session
useLoginForm.ts:53       → navigate("/dashboard") — same URL for all roles
Dashboard.tsx:16         → reads role from store → renders <PatientDashboard />
AppShell.tsx:114         → reads firstName + avatarUrl from store → shows in sidebar
__root.tsx:12            → on page refresh: calls getMe() again to restore the store
PatientDashboard.tsx:16  → useGetAllAppointments({ View: "upcoming", PageSize: 1 })
PatientDashboard.tsx:21  → useGetAllAppointments({ View: "past", PageSize: 1 })
```

---

## Feature 1 — Patient Registration (Public Signup)

**What the user sees:** A public `/register` page with a form asking for username, first name, last name, email, gender, date of birth, IC number, password, and confirm password. After filling everything in and clicking Sign Up, the page redirects to `/login` on success. If the username, email, or IC already exists, a red error message appears instantly.

---

### Step 1 — Route renders the registration page (no auth required)

**File:** [frontend/src/routes/_public/register.tsx](frontend/src/routes/_public/register.tsx)

The `/_public` layout means this route is reachable without logging in. It renders `<RegisterForm />` — a TanStack Form component backed by the `useRegisterForm` hook.

---

### Step 2 — Hook prepares the form and mutation

**File:** [frontend/src/features/auth/hooks/useRegisterForm.ts:8-48](frontend/src/features/auth/hooks/useRegisterForm.ts#L8-L48)

```ts
export function useRegisterForm() {
  const registerMutation = useSignUpPatient();

  const form = useForm({
    defaultValues: {
      username: "", firstName: "", lastName: "", email: "",
      gender: "" as "M" | "F" | "O" | "N",
      dateOfBirth: "", icNumber: "", password: "", confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      await registerMutation.mutateAsync({ data: commandData });
      navigate({ to: "/login" });
    },
  });
}
```

| Line | What it does |
|------|-------------|
| 12 | `useSignUpPatient()` — orval-generated mutation hook that wraps `POST /api/v1/auth/signup-patient` |
| 26-38 | Builds `commandData` — maps form values to the backend contract shape. Drops `confirmPassword` (only needed for client-side validation) |
| 41 | On success → `navigate({ to: "/login" })` — patient lands on the login page to sign in with the new account |
| 44-46 | Catches `ApiError` → shows `detail` (e.g. "An account with this email already exists.") or falls back to `"Registration failed."` |

---

### Step 3 — Zod schema validates before the API is ever called

**File:** [frontend/src/features/auth/schemas/registerSchema.ts:3-16](frontend/src/features/auth/schemas/registerSchema.ts#L3-L16)

```ts
export const registerSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Username must be at most 50 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  gender: z.enum(["M", "F", "O", "N"], { message: "Please select a gender" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  icNumber: z.string().regex(/^\d{12}$/, "IC Number must be exactly 12 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});
```

| Field | Rule |
|-------|------|
| Username | Required, max 50 chars |
| First / Last name | Min 2 chars each |
| Email | Must be valid email format |
| Gender | Must pick M, F, O, or N |
| Date of birth | Required (string in `"YYYY-MM-DD"` format) |
| IC Number | Exactly 12 digits — Malaysian NRIC format |
| Password | Min 8 chars |
| Confirm password | Required (equality checked separately in form UI) |

The IC number, email, and password are **PII/PHI**. The backend marks them `[NotLogged]` via Destructurama — they never appear in logs, exception messages, or API responses.

---

### Step 4 — Backend endpoint receives the signup request

**File:** [backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientEndpoint.cs:8-33](backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientEndpoint.cs#L8-L33)

```csharp
app.MapPost(
    $"{ApiEndpoints.Auth.SignUpPatient}",
    async (
        RegisterPatientCommand command,
        RegisterPatientHandler handler,
        CancellationToken token
    ) =>
    {
        var result = await handler.HandleAsync(command, token);
        return TypedResults.Created(..., new { result.UserPublicId, result.PatientPublicId });
    }
)
.AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();
```

| Part | What it does |
|------|-------------|
| `MapPost` | Registers `POST /api/v1/auth/signup-patient` |
| `ValidationFilter<>` | Runs FluentValidation rules before the handler executes — invalid requests return `400` instantly |
| `TypedResults.Created` | Returns `201 Created` with the new user's public IDs on success |

---

### Step 5 — Handler creates User + Patient in a DB transaction

**File:** [backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientHandler.cs:24-103](backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientHandler.cs#L24-L103)

| Line | What it does |
|------|-------------|
| 39 | `BeginTransactionAsync(ct)` — opens a database transaction. If anything fails, everything rolls back |
| 41-42 | Generates two fresh UUIDs: one for the `User`, one for the `Patient` |
| 44-57 | Builds `User` entity: hashes password with ASP.NET Core `IPasswordHasher`, attaches `"patient"` role |
| 60 | `db.Users.Add(user)` — queues insert |
| 62-81 | **Duplicate guard:** catches `DbUpdateException` with inner `PostgresException`. If unique constraint violated, maps to specific exceptions: `DuplicateUsernameException`, `DuplicateEmailException`, `DuplicateIcNumberException`, `UserAlreadyExistsException` |
| 83-90 | Builds `Patient` entity, linked to `User.Id` via `UserId` |
| 92-95 | Publishes `PatientRegisteredEvent` via MassTransit → AWS SNS |
| 97-98 | `SaveChangesAsync` + `CommitAsync` — both records written atomically |

Think of it like opening a joint bank account: the user record is the main account, the patient record is the savings account linked to it, and the transaction guarantees both are created together or not at all.

---

### Full chain — Feature 1

```
register.tsx                     → renders RegisterForm (public route, no auth)
useRegisterForm.ts:12          → useSignUpPatient() mutation hook
useRegisterForm.ts:15-25         → useForm with defaultValues + onSubmit
registerSchema.ts:3            → Zod validation: icNumber regex ^\d{12}$
useRegisterForm.ts:41          → mutateAsync({ data: commandData })
                                 → POST /api/v1/auth/signup-patient
RegisterPatientEndpoint.cs:10    → MapPost endpoint + ValidationFilter
RegisterPatientHandler.cs:39     → BeginTransactionAsync
RegisterPatientHandler.cs:41     → Guid.NewGuid() for User.PublicId
RegisterPatientHandler.cs:46     → IPasswordHasher.HashPassword(user, cmd.Password)
RegisterPatientHandler.cs:60     → db.Users.Add(user)
RegisterPatientHandler.cs:62     → try { await db.SaveChangesAsync() }
RegisterPatientHandler.cs:66     → catch DbUpdateException → PostgresException unique violation
RegisterPatientHandler.cs:75     → DuplicateUsernameException / DuplicateEmailException / DuplicateIcNumberException
RegisterPatientHandler.cs:86     → db.Patients.Add(patient)
RegisterPatientHandler.cs:92     → publishEndpoint.Publish(new PatientRegisteredEvent(...))
RegisterPatientHandler.cs:98     → transaction.CommitAsync
useRegisterForm.ts:42          → on success → navigate({ to: "/login" })
```

---

## Feature 2 — Patient Dashboard (Stat Cards + Mini Table)

**What the user sees:** Three stat cards at the top — "Upcoming Appointments" count, "Completed Visits" count, and "Next Appointment" (date + doctor name). Below that, a mini table of upcoming appointments with doctor name, specialization, date, time, and status badge. If there are no upcoming appointments, an empty state with a "Book an Appointment" button appears.

---

### Step 1 — Dashboard makes two lightweight count queries

**File:** [frontend/src/features/dashboard/roles/PatientDashboard.tsx:13-32](frontend/src/features/dashboard/roles/PatientDashboard.tsx#L13-L32)

```tsx
export function PatientDashboard() {
  const { data: upcomingData } = useGetAllAppointments({
    View: "upcoming", Page: 1, PageSize: 1,
  });
  const { data: pastData } = useGetAllAppointments({
    View: "past", Page: 1, PageSize: 1,
  });

  const upcoming = upcomingData?.status === 200 ? upcomingData.data : undefined;
  const past = pastData?.status === 200 ? pastData.data : undefined;

  const upcomingCount = Number(upcoming?.totalCount ?? 0);
  const pastCount = Number(past?.totalCount ?? 0);
  const nextAppt = upcoming?.items[0];
```

| Line | What it does |
|------|-------------|
| 16-20 | Calls `useGetAllAppointments({ View: "upcoming", PageSize: 1 })` — asks backend for **only 1 row** because we only need `totalCount` (the stat card number) and `items[0]` (the next appointment) |
| 21-25 | Calls `useGetAllAppointments({ View: "past", PageSize: 1 })` — same trick: `totalCount` gives the "Completed Visits" count |
| 30 | `upcomingCount` — how many upcoming appointments exist |
| 31 | `pastCount` — how many past visits exist |
| 32 | `nextAppt` — the first upcoming row (date, doctorName, etc.) for the "Next Appointment" card |

Why `PageSize: 1`? Because the dashboard only needs counts and the very next appointment. Fetching 50 rows would waste bandwidth. Think of it like asking a restaurant "How many reservations do I have?" — you don't need the full guest list, just the number.

---

### Step 2 — Stat cards map data to UI

**File:** [frontend/src/features/dashboard/roles/PatientDashboard.tsx:34-62](frontend/src/features/dashboard/roles/PatientDashboard.tsx#L34-L62)

```tsx
const stats = [
  {
    title: "Upcoming Appointments",
    value: String(upcomingCount),
    sub: upcomingCount === 1 ? "1 scheduled" : `${upcomingCount} scheduled`,
    icon: Calendar,
    ...
    onClick: () => navigate({ to: "/appointments", search: { today: true } }),
  },
  {
    title: "Completed Visits",
    value: String(pastCount),
    sub: "total past visits",
    icon: CheckCircle2,
    ...
  },
  {
    title: "Next Appointment",
    value: nextAppt ? String(nextAppt.date) : "None",
    sub: nextAppt ? `with ${nextAppt.doctorName}` : "No upcoming visits",
    icon: Clock,
    ...
  },
];
```

Each card is clickable and navigates to `/appointments`. The "Next Appointment" card shows `"None"` when `nextAppt` is undefined — no upcoming visits.

---

### Step 3 — Mini table of upcoming appointments (or empty state)

**File:** [frontend/src/features/dashboard/roles/PatientDashboard.tsx:107-152](frontend/src/features/dashboard/roles/PatientDashboard.tsx#L107-L152)

```tsx
{upcoming?.items && upcoming.items.length > 0 ? (
  <table className="w-full text-sm">
    ...
    <tbody>
      {upcoming.items.map((appt) => (
        <tr key={appt.publicId}>
          <td>{appt.doctorName}</td>
          <td>{appt.specialization}</td>
          <td>{String(appt.date)}</td>
          <td>{String(appt.startTime)}</td>
          <td>
            <span className={`... ${statusStyles[appt.status]}`}>
              {appt.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <div className="flex flex-col items-center ...">
    <Calendar className="size-8 text-muted-foreground/40" />
    <p>No upcoming appointments.</p>
    <Button onClick={() => navigate({ to: "/appointments/book" })}>
      Book an Appointment
    </Button>
  </div>
)}
```

| State | What renders |
|-------|-------------|
| `upcoming.items.length > 0` | A 5-column table: Doctor, Specialization, Date, Time, Status (coloured badge) |
| Empty | Grey calendar icon + "No upcoming appointments." + "Book an Appointment" button |

The status badge uses a static colour map (`Scheduled` = blue, `Completed` = green, `Cancelled` = red). This is simpler than the doctor dashboard which uses dynamic `statusColorCode` from the backend.

---

### Full chain — Feature 2

```
PatientDashboard.tsx:16        → useGetAllAppointments({ View: "upcoming", PageSize: 1 })
PatientDashboard.tsx:21        → useGetAllAppointments({ View: "past", PageSize: 1 })
patients.ts:496                → GET /api/v1/patients/me/appointments?View=upcoming&Page=1&PageSize=1
GetAllAppointmentsHandler.cs:36 → filters upcoming: date > today OR (date == today AND endTime > now)
GetAllAppointmentsHandler.cs:77 → totalCount returned in response
PatientDashboard.tsx:30        → upcomingCount = Number(upcoming?.totalCount ?? 0)
PatientDashboard.tsx:31        → pastCount = Number(past?.totalCount ?? 0)
PatientDashboard.tsx:32        → nextAppt = upcoming?.items[0]
PatientDashboard.tsx:67-88     → renders 3 stat cards with icons + click handlers
PatientDashboard.tsx:107       → upcoming.items map → mini table rows
PatientDashboard.tsx:144       → empty state → "Book an Appointment" button → /appointments/book
```

---

## Feature 3 — Appointments List (Upcoming/Past Tabs + Search + Pagination)

**What the user sees:** A full-page "My Appointments" card with two tabs — "Upcoming" and "Past". A search box filters by doctor name. A "Book New Appointment" button in the header. The table shows Doctor (with avatar initial + specialization), Date, Time, Status (coloured badge), Visit Reason (truncated), and an Actions dropdown (Cancel/Reschedule) for "Booked" appointments only. Previous/Next pagination at the bottom.

> **Note:** The patient appointment detail view (`/appointments/:id`) is currently a stub and not yet implemented. Patients manage appointments from this list page.

---

### Step 1 — Route with search param validator

**File:** [frontend/src/routes/_protected/appointments_.tsx:5-10](frontend/src/routes/_protected/appointments_.tsx#L5-L10)

```ts
export const Route = createFileRoute("/_protected/appointments_")({
  validateSearch: (search: Record<string, unknown>) => ({
    today: search.today === "true" || search.today === true || undefined,
  }),
  component: AppointmentsPage,
});
```

Same `validateSearch` pattern as the doctor appointments page — accepts `?today=true` but normalises it to a boolean. This allows the dashboard stat cards to link directly to the filtered view.

---

### Step 2 — Role dispatch renders PatientAppointmentsList

**File:** [frontend/src/features/appointments/AppointmentsPage.tsx:20-23](frontend/src/features/appointments/AppointmentsPage.tsx#L20-L23)

```tsx
switch (user?.role?.toLowerCase()) {
  case "patient":      return <PatientAppointmentsList />;
  ...
}
```

The `AppointmentsPage` wrapper reads `user.role` from Zustand and renders `<PatientAppointmentsList />` for patients. The breadcrumb `Dashboard → Appointments` is shared across all roles.

---

### Step 3 — Hook fetches appointments with view + pagination

**File:** [frontend/src/features/patients/appointments/components/UseAppointments.tsx:25-44](frontend/src/features/patients/appointments/components/UseAppointments.tsx#L25-L44)

```ts
export function useAppointments(): UseAppointmentsReturn {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AppointmentView>("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: response, isLoading, isError } = useGetAllAppointments({
    View: view,
    Page: page,
    PageSize: PAGE_SIZE,   // 5
  });

  const pagedResult = response?.status === 200 ? response.data : undefined;

  const filteredItems = (pagedResult?.items ?? []).filter((appt) =>
    searchTerm ? appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) : true,
  );
```

| Line | What it does |
|------|-------------|
| 26-28 | Three pieces of local state: page number, active tab (`"upcoming"` or `"past"`), search text |
| 30-38 | `useGetAllAppointments({ View, Page, PageSize: 5 })` — fetches 5 rows per page from the backend |
| 42-44 | **Client-side search:** filters the already-fetched `items` array by `doctorName` substring (case-insensitive). Only the 5 visible rows are filtered — if the user searches for a doctor not on the current page, they get "No results" even if that doctor exists on page 2. This is a UX trade-off: search does not refetch across all pages. |

---

### Step 4 — Tabs toggle the view state

**File:** [frontend/src/features/patients/appointments/AppointmentsList.tsx:34-39](frontend/src/features/patients/appointments/AppointmentsList.tsx#L34-L39)

```tsx
<Tabs value={view} onValueChange={handleViewChange}>
  <TabsList className="grid w-50 grid-cols-2">
    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
    <TabsTrigger value="past">Past</TabsTrigger>
  </TabsList>
</Tabs>
```

Clicking a tab calls `handleViewChange` at [UseAppointments.tsx:49-54](frontend/src/features/patients/appointments/components/UseAppointments.tsx#L49-L54): validates the value is `"upcoming"` or `"past"`, sets `view`, resets `page` to 1, and clears `searchTerm`. This triggers `useGetAllAppointments` to refetch with the new `View` parameter.

---

### Step 5 — Table columns definition

**File:** [frontend/src/features/patients/appointments/components/AppointmentsColumns.tsx:9-80](frontend/src/features/patients/appointments/components/AppointmentsColumns.tsx#L9-L80)

```tsx
columnHelper.accessor("doctorName", {
  header: "Doctor",
  cell: (info) => {
    const name = info.getValue() ?? "Unknown";
    const initial = name.split(" ").at(-1)?.charAt(0) ?? "?";
    return (
      <div className="flex items-center gap-3">
        <div className="flex size-8 ... rounded-full bg-primary/10 ...">
          {initial}
        </div>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-xs text-muted-foreground">
            {info.row.original.specialization ?? "General practice"}
          </div>
        </div>
      </div>
    );
  },
}),
```

| Column | What it shows |
|--------|---------------|
| **Doctor** | Avatar circle with last-name initial + doctor name + specialization below |
| **Date** | Calendar icon + ISO date string |
| **Time** | Clock icon + `startTime` |
| **Status** | Coloured badge using `statusColorCode` from backend (solid background, white text) |
| **Reason** | Truncated `visitReason` with `title` tooltip on hover |
| **Actions** | `<AppointmentActions>` dropdown — only renders for `"Booked"` status |

---

### Step 6 — Actions dropdown (Cancel / Reschedule)

**File:** [frontend/src/features/patients/appointments/components/actions/AppointmentActions.tsx:11-19](frontend/src/features/patients/appointments/components/actions/AppointmentActions.tsx#L11-L19)

```tsx
export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const isActionable = appointment.status?.toLowerCase() === "booked";
  if (!isActionable) {
    return null;
  }
  ...
}
```

The entire Actions column cell is `null` for appointments that are not `"Booked"` — no dropdown appears for `Completed`, `Cancelled`, or `In Progress`. This is a client-side guard; the backend also validates status before accepting any cancel or reschedule request.

---

### Step 7 — Pagination controls

**File:** [frontend/src/features/patients/appointments/components/AppointmentsPagination.tsx:15-47](frontend/src/features/patients/appointments/components/AppointmentsPagination.tsx#L15-L47)

```tsx
<nav aria-label="Appointments pagination" className="flex items-center justify-between px-2">
  <div className="text-sm text-muted-foreground">
    Showing Page {currentPage} of {totalPages ?? 1}
  </div>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={!hasPreviousPage || isLoading}>
      <ChevronLeft /> Previous
    </Button>
    <Button variant="outline" size="sm" onClick={onNextPage} disabled={!hasNextPage || isLoading}>
      Next <ChevronRight />
    </Button>
  </div>
</nav>
```

Page size is **5** (vs 15 for doctors). The pagination section is only rendered when `pagedResult` exists (after the first successful fetch).

---

### Full chain — Feature 3

```
appointments_.tsx:5-8            → route validates ?today search param
AppointmentsPage.tsx:21          → role === "patient" → <PatientAppointmentsList />
AppointmentsList.tsx:34          → Tabs value={view} → handleViewChange
UseAppointments.tsx:26           → view state: "upcoming" | "past"
UseAppointments.tsx:34           → useGetAllAppointments({ View, Page, PageSize: 5 })
                                 → GET /api/v1/patients/me/appointments
GetAllAppointmentsHandler.cs:36  → View filter: upcoming = date >= today, past = date < today
GetAllAppointmentsHandler.cs:61  → search ILike on doctor name or visit reason
GetAllAppointmentsHandler.cs:70  → OrderBy date desc, time asc
GetAllAppointmentsHandler.cs:79  → Skip((page-1)*5).Take(5)
UseAppointments.tsx:42           → client-side filter by doctorName substring
AppointmentsColumns.tsx:14       → avatar initial from last name
AppointmentsColumns.tsx:51       → status badge with statusColorCode
AppointmentsColumns.tsx:78       → AppointmentActions component
AppointmentActions.tsx:15        → isActionable = status === "Booked"
AppointmentsPagination.tsx:26    → Previous/Next buttons, disabled by hasPreviousPage / hasNextPage
```

---

## Feature 4 — Book Appointment (2-Step Wizard)

**What the user sees:** A `/appointments/book` page with a progress bar at the top. Step 1: pick a doctor (or "Any Available Doctor"), pick a date, then pick a time slot from a grid. Past slots are greyed out. Step 2: write a visit reason (min 5 chars), optionally add symptoms (name, severity, duration). A Back button returns to Step 1. Submitting shows a green "Booking Confirmed!" success screen with a button back to the dashboard.

---

### Step 1 — Route guard: only patients can book

**File:** [frontend/src/routes/_protected/appointments.book.tsx:13-22](frontend/src/routes/_protected/appointments.book.tsx#L13-L22)

```ts
export const Route = createFileRoute("/_protected/appointments/book")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    if (user?.role?.toLowerCase() !== "patient") {
      redirect({ to: "/" });
    }
  },
  component: BookAppointmentRouteComponent,
});
```

If a doctor or admin somehow navigates to `/appointments/book`, the `beforeLoad` guard immediately redirects them to `/` (the root landing page). This check runs **before the component mounts**.

---

### Step 2 — BookAppointmentForm: 2-step state machine

**File:** [frontend/src/features/patients/book/BookAppointmentForm.tsx:14-50](frontend/src/features/patients/book/BookAppointmentForm.tsx#L14-L50)

```tsx
export function BookAppointmentForm() {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookMutation = useCreateAppointment();

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value }) => {
      await bookMutation.mutateAsync({ data: payload });
      setIsSuccess(true);
    },
  });

  if (isSuccess) return <BookingSuccess />;

  return (
    <ProgressBar step={step} />
    <Card>
      {step === 1 && <ScheduleForm form={form} onNext={() => setStep(2)} />}
      {step === 2 && <MedicalDetailsForm form={form} onBack={() => setStep(1)} ... />}
    </Card>
  );
}
```

| Line | What it does |
|------|-------------|
| 15 | `step` state: `1` or `2` |
| 16 | `isSuccess` — flips to `true` after the backend returns `201 Created` |
| 17 | `bookingError` — displays a red message if the API call fails |
| 19 | `useCreateAppointment()` — orval-generated mutation for `POST /api/v1/appointments` |
| 48-50 | Success gate: if `isSuccess === true`, the entire form is replaced by `<BookingSuccess />` — no navigation, just conditional rendering |
| 66-74 | Step gate: `step === 1` renders `ScheduleForm`; `step === 2` renders `MedicalDetailsForm` |

Think of it like a multi-page paper form: page 1 is scheduling, page 2 is medical details. You can't submit until both pages are filled, and you can flip back to page 1 if you change your mind.

---

### Step 3 — Step 1: ScheduleForm (doctor, date, time slot)

**File:** [frontend/src/features/patients/book/ScheduleForm.tsx:13-97](frontend/src/features/patients/book/ScheduleForm.tsx#L13-L97)

```tsx
export function ScheduleForm({ form, onNext }: ScheduleStepProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const { doctors, isLoading: isLoadingDoctors } = useDoctorsQuery();
  const { availableSchedules, isLoading, isError } = useScheduleQuery({
    selectedDate,
    selectedDoctorId,
  });

  const handleDoctorChange = (id: string | null) => {
    setSelectedDoctorId(id ?? "");
    form.setFieldValue("schedulePublicId", "");
  };
```

| Line | What it does |
|------|-------------|
| 15-16 | Local state: selected doctor UUID and selected date string (`"YYYY-MM-DD"`) |
| 18 | `useDoctorsQuery()` → `GET /api/v1/doctors` — lists available doctors for the dropdown |
| 19-22 | `useScheduleQuery()` → `GET /api/v1/schedules/available?Date=...&DoctorPublicId=...` — fetches available time slots |
| 24-26 | Changing doctor clears the previously selected time slot (`schedulePublicId` reset) |
| 29-32 | Changing date also clears the selected slot |
| 34-68 | `renderSlotSection()` — four states: no date selected → "Please select a date first"; loading → "Loading…"; error → red alert; zero slots → "No slots available"; otherwise → `ScheduleTimeSlotField` |

---

### Step 3b — Time slot grid with past-slot guard

**File:** [frontend/src/features/patients/book/components/form/ScheduleTimeSlotField.tsx:42-67](frontend/src/features/patients/book/components/form/ScheduleTimeSlotField.tsx#L42-L67)

```tsx
const validSlots = availableSchedules.filter(isValidSlot);
const disabledIds = new Set(validSlots.filter(isPastSlot).map((s) => s.publicId));

return (
  <form.Field name="schedulePublicId" validators={{ onChange: bookingSchema.shape.schedulePublicId }}>
    {(field) => (
      <TimeSlotGrid
        slots={validSlots}
        selectedId={field.state.value}
        onSelect={(id) => field.handleChange(id)}
        disabledIds={disabledIds}
      />
    )}
  </form.Field>
);
```

| Line | What it does |
|------|-------------|
| 42 | `isValidSlot` — ensures every slot has `publicId`, `startTime`, and `endTime` |
| 43 | `isPastSlot` — compares `new Date(`${slot.date}T${slot.startTime}`)` against `new Date()`. If the slot is in the past, its `publicId` is added to `disabledIds` |
| 56-61 | `TimeSlotGrid` receives `disabledIds` — past slots render as greyed-out, unclickable buttons |
| 48 | Validation: `bookingSchema.shape.schedulePublicId` — `z.string().min(1, "Please select a time slot.")`. If no slot is selected, the field error appears and the Next button is disabled |

---

### Step 4 — Step 2: MedicalDetailsForm (reason + symptoms)

**File:** [frontend/src/features/patients/book/MedicalDetailsForm.tsx:9-44](frontend/src/features/patients/book/MedicalDetailsForm.tsx#L9-L44)

```tsx
export function MedicalDetailsForm({ form, onBack, bookingError, isPending }: MedicalDetailsStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle>Medical Details</CardTitle>
        <CardDescription>Please describe your reason for visiting...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <VisitReasonField form={form} />
        <SymptomsArrayField form={form} />
        {bookingError && <p className="text-sm text-destructive" role="alert">{bookingError}</p>}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ChevronLeft className="mr-2 size-4" /> Back
          </Button>
          <SubmitButton form={form} isPending={isPending} />
        </div>
      </CardContent>
    </>
  );
}
```

| Part | What it does |
|------|-------------|
| `VisitReasonField` | Textarea, required, min 5 chars, max 500 |
| `SymptomsArrayField` | "Add Symptom" button. Each symptom has name, severity (Mild/Moderate/Severe select), duration |
| Back button | `onBack={() => setStep(1)}` — returns to scheduling without losing already-selected doctor/date/slot |
| Submit button | Triggers `form.handleSubmit()` → `onSubmit` in `BookAppointmentForm` |
| `bookingError` | Displays if the `POST /api/v1/appointments` fails (e.g. slot was taken by another patient in the meantime) |

---

### Step 5 — On success: BookingSuccess screen

**File:** [frontend/src/features/patients/book/BookingSuccess.tsx:7-28](frontend/src/features/patients/book/BookingSuccess.tsx#L7-L28)

```tsx
export function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <Card className="shadow-lg">
      <CardContent className="py-12 flex flex-col items-center ... space-y-4">
        <div className="rounded-full bg-green-100 p-3 text-green-600">
          <CheckCircle2 className="size-12" />
        </div>
        <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
        <CardDescription>Your appointment has been successfully booked.</CardDescription>
        <Button onClick={() => navigate({ to: "/dashboard" })}>
          Return to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
```

No page reload — the success card replaces the form instantly via React conditional rendering (`isSuccess ? <BookingSuccess /> : <form>...</form>`).

---

### Full chain — Feature 4

```
appointments.book.tsx:13       → beforeLoad guard: role !== "patient" → redirect "/"
BookAppointmentForm.tsx:15     → step state: 1 | 2
BookAppointmentForm.tsx:19     → useCreateAppointment() mutation hook
BookAppointmentForm.tsx:21     → useForm with onSubmit payload builder
ScheduleForm.tsx:15            → selectedDoctorId state
ScheduleForm.tsx:16            → selectedDate state
useDoctorsQuery.ts:4           → useGetAll({ Page: 1, PageSize: 50 }) → GET /api/v1/doctors
useScheduleQuery.ts:13         → useGetAllAvailable({ Date, DoctorPublicId })
                                 → GET /api/v1/schedules/available
ScheduleTimeSlotField.tsx:42   → validSlots.filter(isValidSlot)
ScheduleTimeSlotField.tsx:43   → disabledIds = validSlots.filter(isPastSlot).map(s => s.publicId)
TimeSlotGrid.tsx:14            → grid of TimeSlotButton components
MedicalDetailsForm.tsx:25      → VisitReasonField (textarea, min 5, max 500)
MedicalDetailsForm.tsx:27      → SymptomsArrayField (dynamic array of symptoms)
schema.ts:15                   → bookingSchema: schedulePublicId required, visitReason min 5 max 500
BookAppointmentForm.tsx:40     → mutateAsync({ data: payload })
                                 → POST /api/v1/appointments
BookAppointmentForm.tsx:41     → setIsSuccess(true) → renders <BookingSuccess />
BookingSuccess.tsx:22          → "Return to Dashboard" button → navigate("/dashboard")
```

---

## Feature 5 — Cancel Appointment

**What the user sees:** In the Actions column of a "Booked" appointment, a dropdown with "Reschedule" and "Cancel". Clicking "Cancel" opens a dialog: "Are you sure you want to cancel your appointment with Dr. {name} on {date}?" A textarea asks for a cancellation reason (min 5, max 500 chars). Clicking "Confirm Cancellation" closes the dialog, the appointment row disappears from the upcoming list, and a confirmation email is sent via SNS → Lambda → SES.

---

### Step 1 — Actions dropdown only renders for "Booked" status

**File:** [frontend/src/features/patients/appointments/components/actions/AppointmentActions.tsx:11-19](frontend/src/features/patients/appointments/components/actions/AppointmentActions.tsx#L11-L19)

```tsx
const isActionable = appointment.status?.toLowerCase() === "booked";
if (!isActionable) {
  return null;
}
```

The `<AppointmentActions>` component returns `null` for any appointment that is not exactly `"Booked"`. This is the first gate.

---

### Step 2 — CancelDialog opens with form reset

**File:** [frontend/src/features/patients/appointments/components/actions/CancelDialog.tsx:19-52](frontend/src/features/patients/appointments/components/actions/CancelDialog.tsx#L19-L52)

```tsx
export function CancelDialog({ appointment, isOpen, onOpenChange }: CancelDialogProps) {
  const { form, error, isPending, resetError } = useCancelForm({
    appointmentSlug: appointment.slug,
    onSuccess: () => onOpenChange(false),
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      resetError();
    }
  }, [isOpen, form, resetError]);
```

| Line | What it does |
|------|-------------|
| 20-23 | `useCancelForm` receives the appointment `slug` (a URL-safe identifier like `apt-abc123`) and a success callback that closes the dialog |
| 25-30 | `useEffect` — every time the dialog closes (`!isOpen`), the form resets and any previous error is cleared. This prevents stale data if the user reopens the dialog later |

---

### Step 3 — useCancelForm hook calls the API and invalidates cache

**File:** [frontend/src/features/patients/appointments/components/hooks/useCancelForm.ts:16-47](frontend/src/features/patients/appointments/components/hooks/useCancelForm.ts#L16-L47)

```ts
export function useCancelForm({ appointmentSlug, onSuccess }: UseCancelFormProps) {
  const queryClient = useQueryClient();
  const cancelMutation = useDeleteAppointmentBySlug();

  const form = useForm({
    defaultValues: { cancellationReason: "" },
    validators: { onChange: cancelSchema },
    onSubmit: async ({ value }) => {
      await cancelMutation.mutateAsync({ slug: appointmentSlug, data: value });
      await queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
      onSuccess();
    },
  });
}
```

| Line | What it does |
|------|-------------|
| 17 | `useQueryClient()` — gets the TanStack Query client instance |
| 19 | `useDeleteAppointmentBySlug()` — orval-generated mutation. Despite the name "delete", it calls `PATCH /api/v1/patients/me/appointments/{slug}` |
| 23 | `cancelSchema` — `z.object({ cancellationReason: z.string().min(5).max(500) })` |
| 30 | `mutateAsync({ slug, data: { cancellationReason } })` |
| 33 | `invalidateQueries` — marks **all** `useGetAllAppointments` caches as stale. The UI automatically re-fetches, and the cancelled appointment moves from "Upcoming" to "Past" (or disappears depending on filters) |

---

### Step 4 — Backend validates ownership, cancels, frees slot, publishes event

**File:** [backend/src/TeleHealth.Api/Features/Patients/CancelAppointment/CancelAppointmentHandler.cs:17-84](backend/src/TeleHealth.Api/Features/Patients/CancelAppointment/CancelAppointmentHandler.cs#L17-L84)

| Line | What it does |
|------|-------------|
| 24-32 | Looks up the appointment by `slug` **and** `Patient.User.PublicId == userPublicId` — ensures the appointment belongs to the logged-in patient. Returns `AppointmentNotFoundException` if not found |
| 54-58 | Checks `AppointmentStatus.IsTerminal` — if already `Completed` or `Cancelled`, throws `AppointmentAlreadyTerminatedException` |
| 60-61 | Sets `StatusId = Cancelled` and saves `CancellationReason` |
| 64-65 | Frees the doctor's schedule slot by setting `schedule.StatusId = Available` — another patient can now book this slot |
| 67-73 | Builds `AppointmentCancelledEvent` with `PatientPublicId`, `Reason`, `OccurredAt`, and `PatientEmail` |
| 75-76 | `SaveChangesAsync` + `publishEndpoint.Publish(cancelledEvent)` → MassTransit → AWS SNS |
| 78-83 | Logs success with `PublicId` and `PatientId` — **safe identifiers**, no PII in the log message |

The `PatientEmail` field in the event is passed through to the Lambda/SES pipeline for the cancellation email, but the email itself is not logged.

---

### Full chain — Feature 5

```
AppointmentActions.tsx:15      → isActionable = status === "Booked"
AppointmentActionsDropdown.tsx:43 → "Cancel" menu item → onCancel() → setIsCancelOpen(true)
CancelDialog.tsx:20            → useCancelForm({ appointmentSlug, onSuccess: close dialog })
useCancelForm.ts:19            → useDeleteAppointmentBySlug() mutation
useCancelForm.ts:30            → mutateAsync({ slug, data: { cancellationReason } })
                                 → PATCH /api/v1/patients/me/appointments/{slug}
CancelAppointmentEndpoint.cs:14 → MapPatch endpoint, reads NameIdentifier JWT claim
CancelAppointmentHandler.cs:24  → lookup by slug + patient ownership check
CancelAppointmentHandler.cs:54  → IsTerminal guard → throws if already done
CancelAppointmentHandler.cs:60  → StatusId = Cancelled; CancellationReason = cmd.CancellationReason
CancelAppointmentHandler.cs:65  → schedule.StatusId = Available (free the slot)
CancelAppointmentHandler.cs:67  → new AppointmentCancelledEvent(...) → publishEndpoint.Publish
useCancelForm.ts:33            → invalidateQueries(getGetAllAppointmentsQueryKey())
                                 → UI refetches → appointment moves out of upcoming list
```

---

## Feature 6 — Reschedule Appointment

**What the user sees:** Clicking "Reschedule" in the dropdown opens a dialog: "Select a new time slot for your visit with {doctorName}." A date picker and a dropdown of available slots for that date appear. Past slots are disabled. Selecting a new slot and clicking "Confirm Reschedule" closes the dialog, updates the appointment in the list, and sends an email notification.

---

### Step 1 — RescheduleDialog and useRescheduleForm

**File:** [frontend/src/features/patients/appointments/components/actions/RescheduleDialog.tsx:19-50](frontend/src/features/patients/appointments/components/actions/RescheduleDialog.tsx#L19-L50)

Same structure as `CancelDialog`: dialog wrapper, `useRescheduleForm` hook, form reset on close.

**File:** [frontend/src/features/patients/appointments/components/hooks/useRescheduleForm.ts:16-47](frontend/src/features/patients/appointments/components/hooks/useRescheduleForm.ts#L16-L47)

```ts
export function useRescheduleForm({ appointmentSlug, onSuccess }: UseRescheduleFormProps) {
  const queryClient = useQueryClient();
  const rescheduleMutation = useUpdateAppointmentBySlug();

  const form = useForm({
    defaultValues: { newSchedulePublicId: "" },
    validators: { onChange: rescheduleSchema },
    onSubmit: async ({ value }) => {
      await rescheduleMutation.mutateAsync({ slug: appointmentSlug, data: value });
      await queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
      onSuccess();
    },
  });
}
```

| Line | What it does |
|------|-------------|
| 19 | `useUpdateAppointmentBySlug()` — orval-generated mutation for `PUT /api/v1/patients/me/appointments/{slug}/reschedule` |
| 22 | `rescheduleSchema` — `z.object({ newSchedulePublicId: z.string().min(1) })` |
| 30 | `mutateAsync({ slug, data: { newSchedulePublicId } })` |
| 33 | `invalidateQueries` — same cache-busting pattern as cancel. The list refreshes automatically |

---

### Step 2 — RescheduleAppointmentForm: date picker + slot dropdown

**File:** [frontend/src/features/patients/appointments/components/forms/RescheduleAppointmentForm.tsx:24-130](frontend/src/features/patients/appointments/components/forms/RescheduleAppointmentForm.tsx#L24-L130)

```tsx
export function RescheduleAppointmentForm({ form, error, isPending, onClose }: RescheduleAppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const minDate = new Date().toISOString().split("T")[0];

  const { data: schedulesResponse, isLoading: isLoadingSchedules } = useGetAllAvailable(
    { Date: selectedDate },
    { query: { enabled: !!selectedDate } },
  );
```

| Line | What it does |
|------|-------------|
| 30 | `selectedDate` state — starts empty, user must pick a date first |
| 31 | `minDate` — today's date in `"YYYY-MM-DD"` format, preventing selection of past dates |
| 33-36 | `useGetAllAvailable({ Date: selectedDate })` — fetches available slots for **any doctor** on that date. The query is `enabled: !!selectedDate` so it only fires after a date is chosen |
| 54-61 | `DatePicker` — changing date clears `newSchedulePublicId` so the user can't submit a slot from a previously selected date |
| 63-114 | `form.Field name="newSchedulePublicId"` — a `<Select>` dropdown populated with available slots. Each option is disabled if `isPastSlot(slot)` |
| 100-108 | `SelectContent` maps `availableSchedules` to `<SelectItem>` with `disabled={isPastSlot(slot)}` |

---

### Step 3 — Backend swaps schedules in a transaction

**File:** [backend/src/TeleHealth.Api/Features/Patients/RescheduleAppointment/RescheduleAppointmentHandler.cs:17-107](backend/src/TeleHealth.Api/Features/Patients/RescheduleAppointment/RescheduleAppointmentHandler.cs#L17-L107)

| Line | What it does |
|------|-------------|
| 24 | `BeginTransactionAsync` — all-or-nothing swap |
| 28-35 | Looks up appointment by `slug` + patient ownership |
| 47-48 | Validates `StatusId == Booked` — cannot reschedule completed or cancelled appointments |
| 52-55 | Looks up the new schedule by `newSchedulePublicId` |
| 66-67 | Validates new schedule is `Available` — prevents double-booking |
| 69-71 | **Atomic swap:** `oldSchedule.StatusId = Available`, `newSchedule.StatusId = Booked`, `appointment.ScheduleId = newSchedule.Id` |
| 73-82 | Builds `AppointmentRescheduledEvent` with old date/time, new date/time, and `PatientEmail` |
| 85-86 | `SaveChangesAsync` + `CommitAsync` |
| 97-101 | Concurrency catch: if another patient books the same slot between read and write, `DbUpdateConcurrencyException` rolls back and throws `ScheduleSlotUnavailableException` |

Think of it like swapping seats on a plane: the old seat is released, the new seat is reserved, and both changes must happen together or neither does.

---

### Full chain — Feature 6

```
AppointmentActions.tsx:15        → isActionable = status === "Booked"
AppointmentActionsDropdown.tsx:43 → "Reschedule" menu item → onReschedule() → setIsRescheduleOpen(true)
RescheduleDialog.tsx:20        → useRescheduleForm({ appointmentSlug, onSuccess: close dialog })
useRescheduleForm.ts:19        → useUpdateAppointmentBySlug() mutation
RescheduleAppointmentForm.tsx:30 → selectedDate state
RescheduleAppointmentForm.tsx:33 → useGetAllAvailable({ Date: selectedDate }) → GET /api/v1/schedules/available
RescheduleAppointmentForm.tsx:59 → onChange date → form.setFieldValue("newSchedulePublicId", "")
RescheduleAppointmentForm.tsx:100 → SelectItem disabled={isPastSlot(slot)}
useRescheduleForm.ts:30        → mutateAsync({ slug, data: { newSchedulePublicId } })
                                 → PUT /api/v1/patients/me/appointments/{slug}/reschedule
RescheduleAppointmentEndpoint.cs:17 → MapPut endpoint
RescheduleAppointmentHandler.cs:24 → BeginTransactionAsync
RescheduleAppointmentHandler.cs:28 → lookup appointment by slug + patient ownership
RescheduleAppointmentHandler.cs:47 → StatusId must be Booked
RescheduleAppointmentHandler.cs:52 → lookup new schedule by newSchedulePublicId
RescheduleAppointmentHandler.cs:66 → new schedule must be Available
RescheduleAppointmentHandler.cs:69 → oldSchedule.Available; newSchedule.Booked; appointment.ScheduleId = newSchedule.Id
RescheduleAppointmentHandler.cs:73 → AppointmentRescheduledEvent → publishEndpoint.Publish
RescheduleAppointmentHandler.cs:86 → transaction.CommitAsync
useRescheduleForm.ts:33        → invalidateQueries(getGetAllAppointmentsQueryKey()) → UI refreshes
```

---

## Feature 7 — Medical Profile (Self-Service)

**What the user sees:** A page at `/patients/{id}/medical-profile` with a read-only Personal Information card (avatar initials, full name, email, "Read-only" badge) and an editable Medical Profile card. Inside the editable card: a Blood Group dropdown (A+, A-, B+, B-, O+, O-, AB+, AB-), an Emergency Contact section (toggle Add/Remove, fields for name, relationship, phone), an Allergies section ("Add Allergy" button, each with allergen input, severity select, reaction input, and a coloured left border — green for mild, amber for moderate, red for severe), and a "Save Medical Profile" button.

---

### Step 1 — Triple route guard

**File:** [frontend/src/routes/_protected/patients.$id.medical-profile.tsx:34-52](frontend/src/routes/_protected/patients.$id.medical-profile.tsx#L34-L52)

```ts
export const Route = createFileRoute("/_protected/patients/$id/medical-profile")({
  beforeLoad: ({ params }) => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();
    const userPublicId = user?.publicId;

    if (role !== "patient") {
      throw redirect({ to: "/dashboard" });
    }
    if (!userPublicId) {
      throw redirect({ to: "/login" });
    }
    if (params.id !== userPublicId) {
      throw redirect({
        to: "/patients/$id/medical-profile",
        params: { id: userPublicId },
      });
    }
  },
});
```

| Guard | What it blocks |
|-------|---------------|
| `role !== "patient"` | Doctors, admins, receptionists are redirected to `/dashboard` |
| `!userPublicId` | Unauthenticated users are redirected to `/login` |
| `params.id !== userPublicId` | A patient trying to view `/patients/other-patient-id/medical-profile` is silently redirected to their **own** profile. This prevents horizontal privilege escalation |

Think of it like a hospital locker: you need a patient wristband (role), you need to be checked in (auth), and you can only open your own locker, not someone else's.

---

### Step 2 — Fetch profile on mount

**File:** [frontend/src/features/patients/medical-profile/MedicalProfileForm.tsx:1-29](frontend/src/features/patients/medical-profile/MedicalProfileForm.tsx#L1-L29)

```tsx
export function PatientMedicalProfileForm() {
  const { data: response, isLoading, isError } = useGetProfile();
  const profile = response?.status === 200 ? response.data : undefined;

  if (isLoading) return <div>Loading profile...</div>;
  if (isError || !profile) return <div role="alert">Failed to load profile data.</div>;

  return <ProfileFormInner profile={profile} />;
}
```

`useGetProfile()` is the orval-generated hook for `GET /api/v1/patients/me`. It returns `PatientProfileDto` — the full patient record including `bloodGroup`, `emergencyContact`, `allergies`, and read-only personal info.

---

### Step 3 — ProfileFormInner renders editable sections

**File:** [frontend/src/features/patients/medical-profile/components/ProfileFormInner.tsx:21-103](frontend/src/features/patients/medical-profile/components/ProfileFormInner.tsx#L21-L103)

```tsx
export function ProfileFormInner({ profile }: { profile: PatientProfileDto }) {
  const { form, updateMutation } = useMedicalProfile(profile);

  return (
    <form onSubmit={...} className="space-y-6">
      <PersonalInfoCard profile={profile} />
      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-primary" /> Medical Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blood Group */}
          <form.Field name="bloodGroup">...</form.Field>
          <Separator />
          <EmergencyContactForm form={form} />
          <Separator />
          <AllergiesManager form={form} />
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={!state.canSubmit || updateMutation.isPending}>
              <Save className="mr-2 size-4" /> Save Medical Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
```

| Section | Editable? | Component |
|---------|-----------|-----------|
| Personal Info (name, email) | **No** | `<PersonalInfoCard>` — read-only badge, greyed out |
| Blood Group | Yes | `<Select>` with `BLOOD_GROUP_OPTIONS` |
| Emergency Contact | Yes | Toggle Add/Remove, 3 text inputs |
| Allergies | Yes | Dynamic array — add/remove rows, severity select |
| Save button | Yes | Disabled while `updateMutation.isPending` |

---

### Step 4 — PersonalInfoCard (read-only)

**File:** [frontend/src/features/patients/medical-profile/components/PersonalInfoCard.tsx:63-95](frontend/src/features/patients/medical-profile/components/PersonalInfoCard.tsx#L63-L95)

```tsx
export function PersonalInfoCard({ profile }: PersonalInfoCardProps) {
  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <Card className="shadow-sm">
      <CardContent>
        <div className="flex items-center gap-4 ...">
          <div className="flex size-12 ... rounded-full bg-primary ...">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{profile.firstName} {profile.lastName}</p>
            <p className="text-muted-foreground text-xs">{profile.email}</p>
          </div>
          <div className="... text-[10px] ...">
            <Lock className="size-2.5" /> Read-only
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

The initials are derived from `firstName[0] + lastName[0]`. The "Read-only" badge makes it visually clear these fields are managed elsewhere (the account settings page, not the medical profile).

---

### Step 5 — AllergiesManager with severity colour coding

**File:** [frontend/src/features/patients/medical-profile/components/AllergiesManager.tsx:15-140](frontend/src/features/patients/medical-profile/components/AllergiesManager.tsx#L15-L140)

```tsx
const SEVERITY_BORDER: Record<string, string> = {
  mild: "border-l-green-400",
  moderate: "border-l-amber-400",
  severe: "border-l-red-400",
};

export function AllergiesManager({ form }: AllergiesManagerProps) {
  return (
    <form.Field name="allergies">
      {(field) => (
        <>
          <Button onClick={() => field.pushValue({ id: generateId(), allergen: "", severity: "mild", reaction: "" })}>
            <Plus className="mr-1 size-3" /> Add Allergy
          </Button>
          <div className="space-y-3">
            {field.state.value.map((allergy, i) => (
              <div key={allergy.id}
                className={`... border-l-4 ... ${SEVERITY_BORDER[allergy.severity]}`}>
                {/* allergen input, severity select, reaction input, remove button */}
              </div>
            ))}
          </div>
        </>
      )}
    </form.Field>
  );
}
```

| Severity | Left border colour | Meaning |
|----------|-------------------|---------|
| `mild` | Green | Low risk |
| `moderate` | Amber | Medium risk |
| `severe` | Red | High risk — visually prominent |

Each allergy row is a nested `form.Field` inside the `allergies` array field. TanStack Form handles array push/remove automatically via `field.pushValue` and `field.removeValue(i)`.

---

### Step 6 — useMedicalProfile hook submits to backend

**File:** [frontend/src/features/patients/medical-profile/components/UseMedicalProfile.tsx:9-40](frontend/src/features/patients/medical-profile/components/UseMedicalProfile.tsx#L9-L40)

```ts
export function useMedicalProfile(profile: PatientProfileDto) {
  const updateMutation = useUpdateMedicalRecord();

  const form = useForm({
    defaultValues: {
      bloodGroup: profile.bloodGroup ?? "",
      emergencyContact: profile.emergencyContact ?? null,
      allergies: toFormAllergies(profile.allergies),
    },
    validators: { onChange: medicalInfoSchema },
    onSubmit: async ({ value }) => {
      const allergies: Allergy[] = value.allergies.map(({ id: _id, ...rest }) => ({
        ...rest,
        severity: rest.severity.charAt(0).toUpperCase() + rest.severity.slice(1),
      }));

      await updateMutation.mutateAsync({
        data: {
          bloodGroup: value.bloodGroup,
          emergencyContact: normalizeEmergencyContact(value.emergencyContact),
          allergies,
        },
      });
    },
  });
}
```

| Line | What it does |
|------|-------------|
| 10 | `useUpdateMedicalRecord()` — orval-generated mutation for `PUT /api/v1/patients/me/medical-record` |
| 12-16 | `defaultValues` — pre-fills the form from the fetched profile so the user sees their existing data immediately |
| 21 | `toFormAllergies` — converts backend allergy array into form-ready shape (adds temporary `id` keys for React list keys) |
| 24-27 | Strips temporary `id` fields and capitalises severity (`"mild"` → `"Mild"`) before sending to the backend |
| 30-34 | `mutateAsync({ data: { bloodGroup, emergencyContact, allergies } })` |

---

### Step 7 — Backend updates JSON fields on the Patient record

**File:** [backend/src/TeleHealth.Api/Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordHandler.cs:11-44](backend/src/TeleHealth.Api/Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordHandler.cs#L11-L44)

| Line | What it does |
|------|-------------|
| 21-23 | Looks up `Patient` by `User.PublicId` from JWT. Throws `PatientNotFoundException` if not found |
| 31-34 | Updates three fields directly: `BloodGroup = cmd.BloodGroup`, `EmergencyContact = cmd.EmergencyContact` (JSON object), `Allergies = cmd.Allergies` (JSON list) |
| 36 | `SaveChangesAsync` — EF Core translates the JSON properties into PostgreSQL `jsonb` columns |
| 41-42 | `ReloadAsync` + returns fresh `PatientProfileDto` — ensures the response contains the latest saved data |

The `EmergencyContact` and `Allergies` columns are stored as `jsonb` in PostgreSQL — no separate tables needed. This keeps the schema simple for self-service medical data that doesn't require complex querying.

---

### Full chain — Feature 7

```
patients.$id.medical-profile.tsx:35 → beforeLoad guard 1: role !== "patient" → redirect /dashboard
patients.$id.medical-profile.tsx:40 → beforeLoad guard 2: !userPublicId → redirect /login
patients.$id.medical-profile.tsx:46 → beforeLoad guard 3: params.id !== userPublicId → redirect to own profile
MedicalProfileForm.tsx:5           → useGetProfile() → GET /api/v1/patients/me
GetProfileEndpoint.cs:15           → MapGet, reads NameIdentifier from JWT
GetProfileHandler.cs               → returns PatientProfileDto (bloodGroup, emergencyContact, allergies JSON)
ProfileFormInner.tsx:22            → useMedicalProfile(profile) hook
ProfileFormInner.tsx:34            → <PersonalInfoCard profile={profile} /> (read-only)
ProfileFormInner.tsx:44            → bloodGroup <Select> with BLOOD_GROUP_OPTIONS
ProfileFormInner.tsx:75            → <EmergencyContactForm form={form} /> (toggle add/remove)
AllergiesManager.tsx:25            → form.Field name="allergies" → dynamic array
AllergiesManager.tsx:42            → pushValue({ id, allergen: "", severity: "mild", reaction: "" })
AllergiesManager.tsx:61            → SEVERITY_BORDER[severity] → green/amber/red left border
UseMedicalProfile.tsx:10           → useUpdateMedicalRecord() mutation
UseMedicalProfile.tsx:29           → mutateAsync({ data: { bloodGroup, emergencyContact, allergies } })
                                 → PUT /api/v1/patients/me/medical-record
UpdateMedicalRecordEndpoint.cs:15  → MapPut endpoint
UpdateMedicalRecordHandler.cs:21   → lookup patient by userPublicId
UpdateMedicalRecordHandler.cs:31   → patient.BloodGroup = cmd.BloodGroup
UpdateMedicalRecordHandler.cs:32   → patient.EmergencyContact = cmd.EmergencyContact (JSON)
UpdateMedicalRecordHandler.cs:33   → patient.Allergies = cmd.Allergies (JSON list)
UpdateMedicalRecordHandler.cs:36   → SaveChangesAsync
```

---

## File Index (Patient Features Only)

### Frontend

| File | Feature |
|------|---------|
| [routes/_protected/dashboard.tsx](frontend/src/routes/_protected/dashboard.tsx) | Route entry for dashboard |
| [features/dashboard/Dashboard.tsx](frontend/src/features/dashboard/Dashboard.tsx) | Role dispatch + greeting |
| [features/dashboard/roles/PatientDashboard.tsx](frontend/src/features/dashboard/roles/PatientDashboard.tsx) | Stat cards + mini upcoming table |
| [routes/_protected/appointments_.tsx](frontend/src/routes/_protected/appointments_.tsx) | Route for appointments list |
| [features/appointments/AppointmentsPage.tsx](frontend/src/features/appointments/AppointmentsPage.tsx) | Role dispatch wrapper |
| [features/patients/appointments/AppointmentsList.tsx](frontend/src/features/patients/appointments/AppointmentsList.tsx) | Tabs + search + table layout |
| [features/patients/appointments/components/UseAppointments.tsx](frontend/src/features/patients/appointments/components/UseAppointments.tsx) | Hook: view, page, search, fetch |
| [features/patients/appointments/components/AppointmentsTable.tsx](frontend/src/features/patients/appointments/components/AppointmentsTable.tsx) | TanStack Table wrapper |
| [features/patients/appointments/components/AppointmentsColumns.tsx](frontend/src/features/patients/appointments/components/AppointmentsColumns.tsx) | Column defs: doctor avatar, status badge, actions |
| [features/patients/appointments/components/AppointmentsPagination.tsx](frontend/src/features/patients/appointments/components/AppointmentsPagination.tsx) | Previous/Next controls |
| [features/patients/appointments/components/actions/AppointmentActions.tsx](frontend/src/features/patients/appointments/components/actions/AppointmentActions.tsx) | Gate: only "Booked" gets dropdown |
| [features/patients/appointments/components/actions/AppointmentActionsDropdown.tsx](frontend/src/features/patients/appointments/components/actions/AppointmentActionsDropdown.tsx) | Reschedule / Cancel menu items |
| [features/patients/appointments/components/actions/CancelDialog.tsx](frontend/src/features/patients/appointments/components/actions/CancelDialog.tsx) | Cancel dialog wrapper |
| [features/patients/appointments/components/actions/RescheduleDialog.tsx](frontend/src/features/patients/appointments/components/actions/RescheduleDialog.tsx) | Reschedule dialog wrapper |
| [features/patients/appointments/components/hooks/useCancelForm.ts](frontend/src/features/patients/appointments/components/hooks/useCancelForm.ts) | Cancel form hook + invalidateQueries |
| [features/patients/appointments/components/hooks/useRescheduleForm.ts](frontend/src/features/patients/appointments/components/hooks/useRescheduleForm.ts) | Reschedule form hook + invalidateQueries |
| [features/patients/appointments/components/forms/CancelAppointmentForm.tsx](frontend/src/features/patients/appointments/components/forms/CancelAppointmentForm.tsx) | Cancellation reason textarea |
| [features/patients/appointments/components/forms/RescheduleAppointmentForm.tsx](frontend/src/features/patients/appointments/components/forms/RescheduleAppointmentForm.tsx) | Date picker + slot dropdown |
| [features/patients/appointments/schemas/cancelSchema.ts](frontend/src/features/patients/appointments/schemas/cancelSchema.ts) | Zod: cancellationReason min 5 max 500 |
| [features/patients/appointments/schemas/rescheduleSchema.ts](frontend/src/features/patients/appointments/schemas/rescheduleSchema.ts) | Zod: newSchedulePublicId required |
| [routes/_protected/appointments.book.tsx](frontend/src/routes/_protected/appointments.book.tsx) | Route guard: patients only |
| [features/patients/book/BookAppointmentForm.tsx](frontend/src/features/patients/book/BookAppointmentForm.tsx) | 2-step wizard state machine |
| [features/patients/book/ScheduleForm.tsx](frontend/src/features/patients/book/ScheduleForm.tsx) | Step 1: doctor, date, slots |
| [features/patients/book/hooks/useDoctorsQuery.ts](frontend/src/features/patients/book/hooks/useDoctorsQuery.ts) | Fetch doctor list |
| [features/patients/book/hooks/useScheduleQuery.ts](frontend/src/features/patients/book/hooks/useScheduleQuery.ts) | Fetch available slots |
| [features/patients/book/components/form/ScheduleTimeSlotField.tsx](frontend/src/features/patients/book/components/form/ScheduleTimeSlotField.tsx) | Slot grid with isPastSlot guard |
| [features/patients/book/MedicalDetailsForm.tsx](frontend/src/features/patients/book/MedicalDetailsForm.tsx) | Step 2: reason + symptoms |
| [features/patients/book/components/form/VisitReasonField.tsx](frontend/src/features/patients/book/components/form/VisitReasonField.tsx) | Textarea with min 5 max 500 |
| [features/patients/book/components/form/SymptomsArrayField.tsx](frontend/src/features/patients/book/components/form/SymptomsArrayField.tsx) | Dynamic symptom rows |
| [features/patients/book/BookingSuccess.tsx](frontend/src/features/patients/book/BookingSuccess.tsx) | Green confirmation card |
| [features/patients/book/schema.ts](frontend/src/features/patients/book/schema.ts) | Zod schemas + isPastSlot helper |
| [routes/_protected/patients.$id.medical-profile.tsx](frontend/src/routes/_protected/patients.$id.medical-profile.tsx) | Triple route guard |
| [features/patients/medical-profile/MedicalProfileForm.tsx](frontend/src/features/patients/medical-profile/MedicalProfileForm.tsx) | Fetch + loading/error states |
| [features/patients/medical-profile/components/ProfileFormInner.tsx](frontend/src/features/patients/medical-profile/components/ProfileFormInner.tsx) | Form layout: blood group, emergency contact, allergies |
| [features/patients/medical-profile/components/PersonalInfoCard.tsx](frontend/src/features/patients/medical-profile/components/PersonalInfoCard.tsx) | Read-only name/email/initials |
| [features/patients/medical-profile/components/EmergencyContactForm.tsx](frontend/src/features/patients/medical-profile/components/EmergencyContactForm.tsx) | Toggle add/remove, 3 inputs |
| [features/patients/medical-profile/components/AllergiesManager.tsx](frontend/src/features/patients/medical-profile/components/AllergiesManager.tsx) | Dynamic allergy rows with severity colour borders |
| [features/patients/medical-profile/components/UseMedicalProfile.tsx](frontend/src/features/patients/medical-profile/components/UseMedicalProfile.tsx) | Hook: form defaultValues + submit mutation |
| [features/patients/medical-profile/types.ts](frontend/src/features/patients/medical-profile/types.ts) | BLOOD_GROUP_OPTIONS, SEVERITY_OPTIONS, Zod schemas |
| [features/auth/hooks/useRegisterForm.ts](frontend/src/features/auth/hooks/useRegisterForm.ts) | Registration form hook |
| [features/auth/schemas/registerSchema.ts](frontend/src/features/auth/schemas/registerSchema.ts) | Zod: username, email, IC, password rules |
| [api/generated/patients/patients.ts](frontend/src/api/generated/patients/patients.ts) | Auto-generated orval hooks |
| [api/generated/schedules/schedules.ts](frontend/src/api/generated/schedules/schedules.ts) | `useGetAllAvailable` for slot queries |
| [api/generated/appointments/appointments.ts](frontend/src/api/generated/appointments/appointments.ts) | `useCreateAppointment` for booking |

### Backend

| File | Feature |
|------|---------|
| [Features/Users/Register/RegisterPatientEndpoint.cs](backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientEndpoint.cs) | `POST /api/v1/auth/signup-patient` |
| [Features/Users/Register/RegisterPatientHandler.cs](backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientHandler.cs) | Creates User + Patient, duplicate guards, publishes event |
| [Features/Users/Register/RegisterPatientCommand.cs](backend/src/TeleHealth.Api/Features/Users/Register/RegisterPatientCommand.cs) | DTO: username, email, password, firstName, lastName, icNumber, gender, dateOfBirth |
| [Features/Patients/GetAllAppointments/GetAllAppointmentsEndpoint.cs](backend/src/TeleHealth.Api/Features/Patients/GetAllAppointments/GetAllAppointmentsEndpoint.cs) | `GET /api/v1/patients/me/appointments` |
| [Features/Patients/GetAllAppointments/GetAllAppointmentsHandler.cs](backend/src/TeleHealth.Api/Features/Patients/GetAllAppointments/GetAllAppointmentsHandler.cs) | Filters by patient, view, search, pages |
| [Features/Patients/GetAllAppointments/GetAllAppointmentsQuery.cs](backend/src/TeleHealth.Api/Features/Patients/GetAllAppointments/GetAllAppointmentsQuery.cs) | Query params: View, Status, Search, Page, PageSize, etc. |
| [Features/Patients/GetAllAppointments/AppointmentDto.cs](backend/src/TeleHealth.Api/Features/Patients/GetAllAppointments/AppointmentDto.cs) | Projection: doctorName, specialization, status, statusColorCode, date, startTime, endTime, publicId, slug, visitReason |
| [Features/Patients/CancelAppointment/CancelAppointmentEndpoint.cs](backend/src/TeleHealth.Api/Features/Patients/CancelAppointment/CancelAppointmentEndpoint.cs) | `PATCH /api/v1/patients/me/appointments/{slug}` |
| [Features/Patients/CancelAppointment/CancelAppointmentHandler.cs](backend/src/TeleHealth.Api/Features/Patients/CancelAppointment/CancelAppointmentHandler.cs) | Validates ownership, sets Cancelled, frees slot, publishes event |
| [Features/Patients/CancelAppointment/CancelAppointmentCommand.cs](backend/src/TeleHealth.Api/Features/Patients/CancelAppointment/CancelAppointmentCommand.cs) | `CancellationReason` |
| [Features/Patients/RescheduleAppointment/RescheduleAppointmentEndpoint.cs](backend/src/TeleHealth.Api/Features/Patients/RescheduleAppointment/RescheduleAppointmentEndpoint.cs) | `PUT /api/v1/patients/me/appointments/{slug}/reschedule` |
| [Features/Patients/RescheduleAppointment/RescheduleAppointmentHandler.cs](backend/src/TeleHealth.Api/Features/Patients/RescheduleAppointment/RescheduleAppointmentHandler.cs) | Validates ownership, swaps schedule, transaction, publishes event |
| [Features/Patients/RescheduleAppointment/RescheduleAppointmentCommand.cs](backend/src/TeleHealth.Api/Features/Patients/RescheduleAppointment/RescheduleAppointmentCommand.cs) | `NewSchedulePublicId` |
| [Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordEndpoint.cs](backend/src/TeleHealth.Api/Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordEndpoint.cs) | `PUT /api/v1/patients/me/medical-record` |
| [Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordHandler.cs](backend/src/TeleHealth.Api/Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordHandler.cs) | Updates bloodGroup, emergencyContact, allergies JSON |
| [Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordCommand.cs](backend/src/TeleHealth.Api/Features/Patients/UpdateMedicalRecord/UpdateMedicalRecordCommand.cs) | DTO: bloodGroup, emergencyContact, allergies |
| [Features/Patients/GetProfile/GetProfileEndpoint.cs](backend/src/TeleHealth.Api/Features/Patients/GetProfile/GetProfileEndpoint.cs) | `GET /api/v1/patients/me` |
| [Features/Patients/GetProfile/GetProfileHandler.cs](backend/src/TeleHealth.Api/Features/Patients/GetProfile/GetProfileHandler.cs) | Returns full patient profile including JSON fields |
| [Features/Patients/GetProfile/ProfileDto.cs](backend/src/TeleHealth.Api/Features/Patients/GetProfile/ProfileDto.cs) | `PatientProfileDto` shape |

---

## API Endpoints Summary

| Method | Path | Auth | Feature |
|--------|------|------|---------|
| `POST` | `/api/v1/auth/signup-patient` | Public | Patient registration |
| `GET` | `/api/v1/patients/me/appointments` | Patient | List appointments (upcoming/past) |
| `PATCH` | `/api/v1/patients/me/appointments/{slug}` | Patient | Cancel appointment |
| `PUT` | `/api/v1/patients/me/appointments/{slug}/reschedule` | Patient | Reschedule appointment |
| `POST` | `/api/v1/appointments` | Patient | Book new appointment |
| `GET` | `/api/v1/patients/me` | Patient | Get medical profile |
| `PUT` | `/api/v1/patients/me/medical-record` | Patient | Update medical profile |
| `GET` | `/api/v1/doctors` | Patient | List doctors for booking |
| `GET` | `/api/v1/schedules/available` | Patient | Available time slots |

---

## PII & Sensitive Data Notes

The following fields are **never logged** by the backend (marked `[NotLogged]` via Destructurama):
- Email addresses
- IC numbers (12-digit Malaysian NRIC)
- Passwords and password hashes
- Full names combined with other identifiers
- Phone numbers (when part of emergency contact)

Backend log messages use **generic text** for auth failures:
```csharp
// NEVER
Log.Warning("Login failed for user: {Email}", command.Email);

// CORRECT
Log.Warning("Login failed — account not found.");
Log.Warning("Patient not found. PatientId: {PatientId}", patient.PublicId);
```

API responses also avoid PII in `detail` fields:
```csharp
// NEVER
throw new ConflictException($"Email '{email}' is already registered.");

// CORRECT
throw new DuplicateEmailException(); // detail: "An account with this email already exists."
```
