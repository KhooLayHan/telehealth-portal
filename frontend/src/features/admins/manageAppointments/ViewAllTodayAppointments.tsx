import { Clock, Stethoscope, UserRound } from "lucide-react";

import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Describes the state and records needed to show today's appointment dialog.
interface ViewAllTodayAppointmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// Formats the appointment start and end time as a readable time range.
function formatTimeRange(appointment: ReceptionistAppointmentDto): string {
  const startTime = formatLocalTime(appointment.startTime);
  const endTime = formatLocalTime(appointment.endTime);

  if (!(startTime && endTime)) {
    return startTime || endTime || "Time not set";
  }

  return `${startTime} - ${endTime}`;
}

// Renders a compact status badge for a receptionist appointment.
function TodayAppointmentStatusBadge({
  status,
  colorCode,
}: {
  status: string | undefined;
  colorCode: string | undefined;
}) {
  const color = colorCode ?? "#71717a";

  return (
    <span
      className="inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold capitalize"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {status ?? "Unknown"}
    </span>
  );
}

// Shows every appointment scheduled for today inside a dialog.
export function ViewAllTodayAppointments({
  open,
  onOpenChange,
  appointments,
  isLoading,
}: ViewAllTodayAppointmentsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>Today's Appointments</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {appointments.length} appointment{appointments.length === 1 ? "" : "s"} scheduled today
          </p>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {isLoading ? (
            <p className="py-10 text-center text-muted-foreground text-sm">
              Loading today's appointments...
            </p>
          ) : appointments.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground text-sm">
              No appointments scheduled today.
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div
                  key={appointment.publicId}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-2 text-foreground">
                      <Clock className="size-4 text-muted-foreground" />
                      <span className="font-mono font-semibold text-sm">
                        {formatTimeRange(appointment)}
                      </span>
                    </div>
                    <TodayAppointmentStatusBadge
                      status={appointment.status}
                      colorCode={appointment.statusColorCode}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {appointment.patientName}
                        </p>
                        <p className="text-muted-foreground text-xs">Patient</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Stethoscope className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm">
                          {appointment.doctorName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {appointment.specialization}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md bg-muted/50 px-3 py-2">
                    <p className="text-muted-foreground text-xs">Visit reason</p>
                    <p className="text-foreground text-sm">
                      {appointment.visitReason || "No visit reason provided."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
