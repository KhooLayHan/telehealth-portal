import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DayData } from "./UseAdminAppointments";

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

// Describes the data and controls needed to render the appointment calendar view.
interface AppointmentCalendarProps {
  currentYear: number;
  currentMonth: number;
  selectedDay: number;
  scheduledDays: DayData[];
  monthItems: ReceptionistAppointmentDto[];
  todayAppointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
  onDayChange: (day: number) => void;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

// Describes the current calendar day selection shown in the detail dialog.
interface AppointmentDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: { year: number; month: number; day: number };
  appointments: ReceptionistAppointmentDto[];
}

// Describes the props for the compact month calendar.
interface MiniCalendarProps {
  year: number;
  month: number;
  selectedDay: number;
  scheduledDays: DayData[];
  onDaySelect: (day: number) => void;
  onPrev: () => void;
  onNext: () => void;
}

// Describes the data required for the same-day appointment sidebar.
interface UpcomingTodayPanelProps {
  appointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
}

// Converts a NodaTime LocalTime string into a compact 12-hour display time.
function formatLocalTime(time: string | undefined): string {
  if (!time) return "";
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = minuteStr?.padStart(2, "0") ?? "00";
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

// Converts year/month/day into an ISO date string for matching appointment dates.
function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// Returns the zero-based Monday-first weekday offset for the first day of a month.
function firstDayOffset(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Returns the number of days in the provided month.
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Displays the visit reason as a small uppercase badge.
function AppointmentTypeBadge({ visitReason }: { visitReason: string }) {
  return (
    <span className="inline-flex items-center rounded bg-zinc-800 px-1.5 py-0.5 font-semibold text-[10px] text-zinc-300 tracking-wide">
      {visitReason.toUpperCase()}
    </span>
  );
}

// Displays a compact month grid with markers for scheduled appointment days.
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
  const scheduledSet = new Map(scheduledDays.map((day) => [day.day, day.count]));
  const slotKeys = ["s0", "s1", "s2", "s3", "s4", "s5"] as const;
  const dotKeys = ["d0", "d1", "d2"] as const;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-semibold text-base text-foreground">
          {MONTH_NAMES[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onPrev}
            className="h-7 w-7"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="h-7 w-7"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block size-2 rounded-full bg-foreground" />
          SCHEDULED
        </span>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="py-1 text-center font-medium text-[11px] text-muted-foreground"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {slotKeys.slice(0, offset).map((slotKey) => (
          <div key={slotKey} />
        ))}

        {Array.from({ length: totalDays }, (_, index) => {
          const day = index + 1;
          const count = scheduledSet.get(day) ?? 0;
          const isSelected = day === selectedDay;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDaySelect(day)}
              className={cn(
                "relative flex h-12 flex-col items-center justify-start rounded-md pt-1.5 pb-1 font-medium text-sm transition-colors",
                isSelected ? "bg-foreground text-background" : "text-foreground hover:bg-muted",
              )}
            >
              <span>{day}</span>
              {count > 0 && (
                <span className="mt-0.5 flex items-center gap-0.5">
                  {dotKeys.slice(0, Math.min(count, 3)).map((dotKey) => (
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

// Displays appointments scheduled for the current day in a sidebar panel.
function UpcomingTodayPanel({ appointments, isLoading }: UpcomingTodayPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-zinc-900">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-semibold text-lg text-white">Upcoming Today</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-4">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading...</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-zinc-400">No appointments today.</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.publicId} className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 font-semibold text-xs text-zinc-400">
                  {formatLocalTime(appointment.startTime)}
                </span>
                <AppointmentTypeBadge visitReason={appointment.visitReason ?? ""} />
              </div>
              <p className="pl-[4.5rem] font-semibold text-sm text-white">
                {appointment.patientName}
              </p>
              <p className="pl-[4.5rem] text-xs text-zinc-400">
                {appointment.doctorName} &middot; {appointment.specialization}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="border-zinc-800 border-t px-5 pt-2 pb-5">
        <Button
          type="button"
          variant="outline"
          className="w-full border-white/50 bg-transparent text-white hover:bg-white/10 hover:text-white"
        >
          View All Tasks
        </Button>
      </div>
    </div>
  );
}

// Displays a scrollable appointment list for the selected calendar date.
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
          <DialogTitle>Appointments - {label}</DialogTitle>
        </DialogHeader>

        {appointments.length === 0 ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            No appointments scheduled for this day.
          </p>
        ) : (
          <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
            {appointments.map((appointment) => (
              <div
                key={appointment.publicId}
                className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="flex w-16 shrink-0 flex-col items-start gap-1 pt-0.5">
                  <span className="font-mono font-semibold text-foreground text-xs">
                    {formatLocalTime(appointment.startTime)}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <AppointmentTypeBadge visitReason={appointment.visitReason ?? ""} />
                  <p className="font-semibold text-foreground text-sm">{appointment.patientName}</p>
                  <p className="text-muted-foreground text-xs">
                    {appointment.doctorName} &middot; {appointment.specialization}
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

// Renders the admin appointment calendar view and selected-day appointment dialog.
export function AppointmentCalendar({
  currentYear,
  currentMonth,
  selectedDay,
  scheduledDays,
  monthItems,
  todayAppointments,
  isLoading,
  onDayChange,
  onPreviousMonth,
  onNextMonth,
}: AppointmentCalendarProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectedDateIso = toIsoDate(currentYear, currentMonth, selectedDay);
  const dialogAppointments = monthItems.filter(
    (appointment) => appointment.date === selectedDateIso,
  );

  function handleDaySelect(day: number) {
    onDayChange(day);
    setDialogOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-xl border border-border bg-card p-5">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading calendar...</p>
          ) : (
            <MiniCalendar
              year={currentYear}
              month={currentMonth}
              selectedDay={selectedDay}
              scheduledDays={scheduledDays}
              onDaySelect={handleDaySelect}
              onPrev={onPreviousMonth}
              onNext={onNextMonth}
            />
          )}
        </div>

        <UpcomingTodayPanel appointments={todayAppointments} isLoading={isLoading} />
      </div>

      <AppointmentDayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        date={{ year: currentYear, month: currentMonth, day: selectedDay }}
        appointments={dialogAppointments}
      />
    </>
  );
}
