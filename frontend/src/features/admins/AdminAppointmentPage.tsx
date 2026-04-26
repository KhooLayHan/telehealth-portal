import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type DayData, useAdminAppointments } from "../appointments/roles/UseAdminAppointments";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Converts a NodaTime LocalTime string "HH:mm:ss" to a 12-hour display string "H:mm AM/PM"
function formatLocalTime(time: string | undefined): string {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = minuteStr?.padStart(2, "0") ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

// Converts year/month/day to ISO "YYYY-MM-DD" string for filtering appointments by date
function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Returns the ISO weekday index (0 = Mon … 6 = Sun) for the 1st of the month. */
function firstDayOffset(year: number, month: number): number {
  // JS getDay(): 0=Sun … 6=Sat; we want 0=Mon … 6=Sun
  const jsDay = new Date(year, month, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Displays the visit reason as an uppercase label badge
function AppointmentTypeBadge({ visitReason }: { visitReason: string }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-zinc-800 text-zinc-300">
      {visitReason.toUpperCase()}
    </span>
  );
}

// Renders a status badge using the color code returned by the API
function AppointmentStatusBadge({
  status,
  colorCode,
}: {
  status: string;
  colorCode: string | undefined;
}) {
  const color = colorCode ?? "#71717a";
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {status}
    </span>
  );
}

interface MiniCalendarProps {
  year: number;
  month: number;
  selectedDay: number;
  scheduledDays: DayData[];
  onDaySelect: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

function MiniCalendar({
  year,
  month,
  selectedDay,
  scheduledDays,
  onDaySelect,
  onPrev,
  onNext,
}: MiniCalendarProps) {
  const offset = firstDayOffset(year, month);
  const totalDays = daysInMonth(year, month);
  const scheduledSet = new Map(scheduledDays.map((d) => [d.day, d.count]));

  // Stable keys for leading empty slots — at most 6 (Mon-Sat offset)
  const SLOT_KEYS = ["s0", "s1", "s2", "s3", "s4", "s5"] as const;
  const DOT_KEYS = ["d0", "d1", "d2"] as const;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-base text-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-foreground" />
          SCHEDULED
        </span>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-[11px] font-medium text-muted-foreground py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Leading empty slots */}
        {SLOT_KEYS.slice(0, offset).map((slotKey) => (
          <div key={slotKey} />
        ))}

        {/* Day cells */}
        {Array.from({ length: totalDays }, (_, i) => {
          const day = i + 1;
          const count = scheduledSet.get(day) ?? 0;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDaySelect(day)}
              className={cn(
                "relative flex flex-col items-center justify-start pt-1.5 pb-1 h-12 rounded-md text-sm font-medium transition-colors",
                isSelected ? "bg-foreground text-background" : "hover:bg-muted text-foreground",
              )}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className="mt-0.5 flex items-center gap-0.5">
                  {DOT_KEYS.slice(0, Math.min(count, 3)).map((dotKey) => (
                    <span
                      key={dotKey}
                      className={cn(
                        "inline-block size-1 rounded-full",
                        isSelected ? "bg-background" : "bg-foreground",
                      )}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface UpcomingTodayPanelProps {
  appointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
}

function UpcomingTodayPanel({ appointments, isLoading }: UpcomingTodayPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-white font-semibold text-lg">Upcoming Today</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        {isLoading ? (
          <p className="text-zinc-400 text-sm">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="text-zinc-400 text-sm">No appointments today.</p>
        ) : (
          appointments.map((appt) => (
            <div key={appt.publicId} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">
                  {formatLocalTime(appt.startTime)}
                </span>
                <AppointmentTypeBadge visitReason={appt.visitReason ?? ""} />
              </div>
              <p className="text-white font-semibold text-sm pl-[4.5rem]">{appt.patientName}</p>
              <p className="text-zinc-400 text-xs pl-[4.5rem]">
                {appt.doctorName} · {appt.specialization}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="px-5 pb-5 pt-2 border-t border-zinc-800">
        <button
          type="button"
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white border border-white/50 hover:bg-white/10 transition-colors"
        >
          View All Tasks
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day detail dialog — shows scrollable list of appointments for a selected date
// ---------------------------------------------------------------------------

interface AppointmentDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: { year: number; month: number; day: number };
  appointments: ReceptionistAppointmentDto[];
}

function AppointmentDayDialog({
  open,
  onOpenChange,
  date,
  appointments,
}: AppointmentDayDialogProps) {
  const label = `${MONTH_NAMES[date.month]} ${date.day}, ${date.year}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Appointments — {label}</DialogTitle>
        </DialogHeader>

        {appointments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No appointments scheduled for this day.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-1 space-y-4">
            {appointments.map((appt) => (
              <div
                key={appt.publicId}
                className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex w-16 shrink-0 flex-col items-start gap-1 pt-0.5">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {formatLocalTime(appt.startTime)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <AppointmentTypeBadge visitReason={appt.visitReason ?? ""} />
                  <p className="text-sm font-semibold text-foreground">{appt.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {appt.doctorName} · {appt.specialization}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

interface ListViewTableProps {
  appointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

function ListViewTable({
  appointments,
  isLoading,
  page,
  totalPages,
  onPrev,
  onNext,
}: ListViewTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Visit Reason
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Doctor</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading appointments…
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appt) => (
                <tr key={appt.publicId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-foreground">
                    {formatLocalTime(appt.startTime)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{appt.date}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{appt.patientName}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{appt.visitReason}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {appt.doctorName} · {appt.specialization}
                  </td>
                  <td className="px-4 py-3">
                    <AppointmentStatusBadge
                      status={appt.status ?? ""}
                      colorCode={appt.statusColorCode}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrev}
            disabled={page <= 1}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={page >= totalPages}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted disabled:opacity-40"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type ViewMode = "calendar" | "list";

export function AdminAppointmentPage() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [search, setSearch] = useState("");

  const {
    monthItems,
    scheduledDays,
    todayAppointments,
    isMonthLoading,
    listItems,
    listTotalPages,
    isListLoading,
  } = useAdminAppointments(currentYear, currentMonth, listPage, search);

  function handleDaySelect(day: number) {
    setSelectedDay(day);
    setDialogOpen(true);
  }

  // Filter month appointments by the selected day for the dialog
  const selectedDateIso = toIsoDate(currentYear, currentMonth, selectedDay);
  const dialogAppointments = monthItems.filter((a) => a.date === selectedDateIso);

  function handlePrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(1);
  }

  function handleNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(1);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">View Appointments</h1>
        <p className="text-muted-foreground text-sm">
          View all scheduled appointments in one place
        </p>
      </div>

      {/* Search bar + view toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search by patient name, doctor, or visit reason…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setListPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="inline-flex shrink-0 rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors",
              viewMode === "calendar"
                ? "bg-background text-foreground border-r border-foreground ring-1 ring-foreground ring-inset"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Calendar View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-background text-foreground ring-1 ring-foreground ring-inset"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <List className="size-3.5" />
            List View
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]"
          >
            {/* Calendar card */}
            <div className="rounded-xl border border-border bg-card p-5">
              {isMonthLoading ? (
                <p className="text-sm text-muted-foreground">Loading calendar…</p>
              ) : (
                <MiniCalendar
                  year={currentYear}
                  month={currentMonth}
                  selectedDay={selectedDay}
                  scheduledDays={scheduledDays}
                  onDaySelect={handleDaySelect}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              )}
            </div>

            {/* Upcoming today panel */}
            <UpcomingTodayPanel appointments={todayAppointments} isLoading={isMonthLoading} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <ListViewTable
              appointments={listItems}
              isLoading={isListLoading}
              page={listPage}
              totalPages={listTotalPages}
              onPrev={() => setListPage((p) => Math.max(1, p - 1))}
              onNext={() => setListPage((p) => Math.min(listTotalPages, p + 1))}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AppointmentDayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={{ year: currentYear, month: currentMonth, day: selectedDay }}
        appointments={dialogAppointments}
      />
    </div>
  );
}
