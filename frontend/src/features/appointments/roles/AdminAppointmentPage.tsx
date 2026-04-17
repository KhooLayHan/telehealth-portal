import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AppointmentType =
  | "FOLLOW-UP"
  | "GENERAL CHECKUP"
  | "POST-OP REVIEW"
  | "CONSULTATION"
  | "LAB REVIEW";

interface TodayAppointment {
  id: string;
  time: string;
  type: AppointmentType;
  patientName: string;
  detail: string;
}

// Days that have scheduled appointments (day-of-month numbers)
type DayData = { day: number; count: number };

// ---------------------------------------------------------------------------
// Mock data — replace with API data once endpoint is available
// ---------------------------------------------------------------------------

const MOCK_TODAY_APPOINTMENTS: TodayAppointment[] = [
  {
    id: "1",
    time: "09:30 AM",
    type: "FOLLOW-UP",
    patientName: "Eleanor P. Shellstrop",
    detail: "Virtual Consult • Room 04",
  },
  {
    id: "2",
    time: "11:15 AM",
    type: "GENERAL CHECKUP",
    patientName: "Chidi Anagonye",
    detail: "In-person • Station B",
  },
  {
    id: "3",
    time: "02:00 PM",
    type: "POST-OP REVIEW",
    patientName: "Tahani Al-Jamil",
    detail: "Virtual Consult • Room 12",
  },
  {
    id: "4",
    time: "04:45 PM",
    type: "FOLLOW-UP",
    patientName: "Jason Mendoza",
    detail: "Virtual Consult • Room 04",
  },
];

// Which days in the month have scheduled appointments and how many
const MOCK_SCHEDULED_DAYS: DayData[] = [
  { day: 3, count: 1 },
  { day: 4, count: 1 },
  { day: 6, count: 3 },
  { day: 10, count: 2 },
  { day: 13, count: 2 },
];

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

function AppointmentTypeBadge({ type }: { type: AppointmentType }) {
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-zinc-800 text-zinc-300">
      {type}
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
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block size-2 rounded-full border border-foreground" />
          AVAILABLE
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
  appointments: TodayAppointment[];
}

function UpcomingTodayPanel({ appointments }: UpcomingTodayPanelProps) {
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-xl overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-white font-semibold text-lg">Upcoming Today</h3>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        {appointments.map((appt) => (
          <div key={appt.id} className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">{appt.time}</span>
              <AppointmentTypeBadge type={appt.type} />
            </div>
            <p className="text-white font-semibold text-sm pl-[4.5rem]">{appt.patientName}</p>
            <p className="text-zinc-400 text-xs pl-[4.5rem]">{appt.detail}</p>
          </div>
        ))}
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
// List view — simple table of all appointments for the selected month
// ---------------------------------------------------------------------------

function ListViewTable(_props: { scheduledDays: DayData[] }) {
  const allItems: TodayAppointment[] = MOCK_TODAY_APPOINTMENTS;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Patient</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {allItems.map((appt) => (
            <tr key={appt.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-foreground">{appt.time}</td>
              <td className="px-4 py-3 font-medium text-foreground">{appt.patientName}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide bg-muted text-muted-foreground">
                  {appt.type}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{appt.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
      {/* View toggle */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border overflow-hidden">
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
              <MiniCalendar
                year={currentYear}
                month={currentMonth}
                selectedDay={selectedDay}
                scheduledDays={MOCK_SCHEDULED_DAYS}
                onDaySelect={setSelectedDay}
                onPrev={handlePrev}
                onNext={handleNext}
              />
            </div>

            {/* Upcoming today panel */}
            <UpcomingTodayPanel appointments={MOCK_TODAY_APPOINTMENTS} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <ListViewTable scheduledDays={MOCK_SCHEDULED_DAYS} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
