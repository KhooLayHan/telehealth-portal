# ViewDoctorScheduleDialog.tsx Explanation

## Short Version
`ViewDoctorScheduleDialog` is an admin/receptionist UI dialog that fetches a doctor's schedule slots for a selected date, then shows them in two layouts (table and grouped daily view). It uses a generated TanStack Query hook (`useGetDailySchedulesForReceptionist`) to call `GET /api/v1/schedules/daily` and render backend slot + appointment data. It also opens two child dialogs for creating and deleting schedule slots (`AddDoctorScheduleForm` and `DeleteScheduleDialog`).

## Files Reviewed
| File | Why it matters |
|------|----------------|
| `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx` | Main component you asked about; owns date navigation, data fetch, metrics, and rendering logic. |
| `frontend/src/api/generated/schedules/schedules.ts` | Generated API client/hook used by the dialog to fetch daily schedule data. |
| `frontend/src/features/schedules/ScheduleUtils.ts` | Utility helpers for date defaults and date increment/decrement used in the dialog. |
| `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesEndpoint.cs` | Backend endpoint mapping for the exact API route used by the dialog. |
| `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesQuery.cs` | Query parameter contract (`Date`, optional `DoctorPublicId`) expected by the endpoint. |
| `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesHandler.cs` | Core backend logic that validates the date and joins schedules with latest appointment per slot. |
| `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/ReceptionistDailyScheduleDto.cs` | Response DTO shape returned to the frontend and rendered in the dialog. |

## Technical Flow
1. Parent page passes `doctor`, `open`, and `onOpenChange` into `ViewDoctorScheduleDialog`.
2. Dialog initializes `selectedDate` using `getTodayStr()` and lets user move dates with `addDays` or native `<input type="date">`.
3. It calls `useGetDailySchedulesForReceptionist({ Date, DoctorPublicId? }, { enabled })`.
4. Generated hook issues `GET /api/v1/schedules/daily?...`.
5. Backend endpoint requires `AuthConstants.AdminOrReceptionistPolicy`, parses the query, and calls handler.
6. Handler validates the date string, queries schedules for that date (+ optional doctor filter), loads latest appointment per slot, then maps to `ReceptionistDoctorScheduleSlotDto`.
7. Frontend computes summary metrics and renders either:
   - **Schedule Slots tab** (table/card list), or
   - **Daily View tab** (grouped by day label).
8. User actions:
   - **Add Schedule** → opens `AddDoctorScheduleForm`.
   - **Remove Schedule** (only for `available`/`blocked`) → opens `DeleteScheduleDialog` with selected slot.

## Frontend Code
From `frontend/src/features/admins/manageDoctors/ViewDoctorScheduleDialog.tsx`:

```tsx
const scheduleQuery = useGetDailySchedulesForReceptionist(
  { Date: selectedDate, ...(doctorPublicId ? { DoctorPublicId: doctorPublicId } : {}) },
  { query: { enabled: open && Boolean(doctorPublicId) } },
);
```

This is the fetch trigger. It sends the selected date and optional doctor public ID. `enabled` avoids fetching when the dialog is closed or doctor is missing.

```tsx
const backendScheduleSlots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
  () => (scheduleQuery.data?.status === 200 ? scheduleQuery.data.data : []),
  [scheduleQuery.data],
);
```

The API response is modeled as a typed union (`200` or `401`). This line safely extracts rows only when status is `200`.

```tsx
const hasLoadError = scheduleQuery.isError || scheduleQuery.data?.status === 401;
```

The UI treats network/query errors and unauthorized (`401`) as load failures and shows the same error message.

```tsx
const handleRequestRemoveScheduleSlot = (slot: ReceptionistDoctorScheduleSlotDto) => {
  if (!canRemoveScheduleSlot(slot)) {
    return;
  }
  setSelectedScheduleSlot(slot);
  setDeleteScheduleOpen(true);
};
```

This enforces a business rule in UI: only `available` or `blocked` slots can be removed.

From `frontend/src/api/generated/schedules/schedules.ts`:

```ts
return stringifiedParams.length > 0 ? `/api/v1/schedules/daily?${stringifiedParams}` : `/api/v1/schedules/daily`
```

This is the generated URL builder for the exact endpoint the dialog hits.

```ts
const queryFn: QueryFunction<Awaited<ReturnType<typeof getDailySchedulesForReceptionist>>> =
  ({ signal }) => getDailySchedulesForReceptionist(params, { signal, ...requestOptions });
```

This is the TanStack Query function behind the hook.

From `frontend/src/features/schedules/ScheduleUtils.ts`:

```ts
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
```

This ensures the dialog starts with a `YYYY-MM-DD` date string that the backend parser expects.

## Backend Code
From `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesEndpoint.cs`:

```csharp
group
    .MapGet(ApiEndpoints.Schedules.GetDailyForReceptionist, ...)
    .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)
    .ProducesProblem(StatusCodes.Status401Unauthorized);
```

This maps the route and locks it to admin/receptionist users.

From `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesQuery.cs`:

```csharp
public sealed record GetDailySchedulesQuery(string Date, Guid? DoctorPublicId = null);
```

The endpoint expects a required date plus optional doctor filter.

From `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/GetDailySchedulesHandler.cs`:

```csharp
if (string.IsNullOrWhiteSpace(query.Date))
{
    Log.Warning("A valid date (YYYY-MM-DD) must be provided in the query string");
    throw new InvalidateDateException();
}

var parseResult = LocalDatePattern.Iso.Parse(query.Date);
if (!parseResult.Success)
{
    Log.Warning("Invalid date format. Use YYYY-MM-DD.");
    throw new InvalidateDateException();
}
```

The backend re-validates the date format, even if frontend input is constrained.

```csharp
var dbQuery = db
    .DoctorSchedules.AsNoTracking()
    .Include(s => s.ScheduleStatus)
    .Include(s => s.Doctor)
        .ThenInclude(d => d.User)
    .Where(s => s.Date == targetDate);

if (query.DoctorPublicId.HasValue)
{
    dbQuery = dbQuery.Where(s => s.Doctor.PublicId == query.DoctorPublicId.Value);
}
```

This builds the base schedule query and applies optional doctor filter.

```csharp
var allAppointments = await db
    .Appointments.AsNoTracking()
    .Include(a => a.Patient)
        .ThenInclude(p => p.User)
    .Include(a => a.AppointmentStatus)
    .Where(a => scheduleIds.Contains(a.ScheduleId))
    .OrderByDescending(a => a.CreatedAt)
    .ToListAsync(ct);
```

Appointments are sorted newest-first so each slot can show the latest booking state.

From `backend/src/TeleHealth.Api/Features/Schedules/GetDailySchedulesForReceptionist/ReceptionistDailyScheduleDto.cs`:

```csharp
public sealed record ReceptionistDoctorScheduleSlotDto
{
    public Guid PublicId { get; init; }
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }
    ...
    public Guid? AppointmentPublicId { get; init; }
    public string? PatientName { get; init; }
    public string? VisitReason { get; init; }
    public string? AppointmentStatus { get; init; }
}
```

This is the exact shape rendered in the dialog rows/cards.

## End-to-End Code Flow
1. User opens “Doctor Schedule” dialog from the admin doctor management UI.
2. Frontend sets a default date string (`YYYY-MM-DD`) and sends it in the generated query hook.
3. Hook calls `/api/v1/schedules/daily` with `Date` (+ `DoctorPublicId` when present).
4. Backend endpoint authorizes caller with `AdminOrReceptionistPolicy`.
5. Handler validates date, queries schedules, and enriches each slot with latest appointment data.
6. Backend returns `List<ReceptionistDoctorScheduleSlotDto>`.
7. Frontend computes totals (available/booked/blocked), then renders slots in table or daily grouping.
8. User can open add/delete dialogs to mutate schedule entries.

## Important Details
- The dialog fetch is **conditionally enabled** (`open && Boolean(doctorPublicId)`), reducing unnecessary API calls.
- Unauthorized responses (`401`) are explicitly represented in the generated response type and mapped to an error state.
- Deletion action is intentionally limited in UI to `available` or `blocked` slots.
- The backend uses **NodaTime** (`LocalDate`, `LocalTime`) in DTOs and parsing, matching project date/time conventions.
- The backend comment explains why latest appointment per schedule is chosen: to correctly reflect re-booked/cancelled/completed history.

## Beginner Programmer Notes
- **Generated hook**: Orval created `useGetDailySchedulesForReceptionist`; you consume it like any other TanStack Query hook.
- **DTO**: A Data Transfer Object is the backend response shape optimized for UI display.
- **`AsNoTracking()`**: EF Core optimization for read-only queries.
- **Policy-based auth**: `.RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)` is safer and more maintainable than role strings.
- **Defensive validation**: Backend re-checks date format regardless of frontend controls.
