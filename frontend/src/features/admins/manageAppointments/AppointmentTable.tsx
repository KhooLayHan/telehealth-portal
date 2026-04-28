import { ChevronLeft, ChevronRight } from "lucide-react";

import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Describes the data and pagination controls needed to render the admin appointment table.
interface AppointmentTableProps {
  appointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
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

// Renders an appointment status badge using the color code returned by the API.
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
      className="inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold capitalize tracking-wide"
      style={{ backgroundColor: `${color}33`, color }}
    >
      {status}
    </span>
  );
}

// Displays the paginated appointment list for the admin appointment page.
export function AppointmentTable({
  appointments,
  isLoading,
  page,
  totalPages,
  onPrev,
  onNext,
}: AppointmentTableProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-foreground/20 bg-foreground hover:bg-foreground">
              <TableHead className="w-32 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Time
              </TableHead>
              <TableHead className="w-36 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Date
              </TableHead>
              <TableHead className="min-w-48 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Patient
              </TableHead>
              <TableHead className="min-w-80 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Visit Reason
              </TableHead>
              <TableHead className="min-w-56 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Doctor
              </TableHead>
              <TableHead className="w-32 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">Loading appointments...</p>
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">No appointments found.</p>
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow
                  key={appointment.publicId}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                >
                  <TableCell className="px-5 py-3.5 font-mono text-sm">
                    {formatLocalTime(appointment.startTime)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 font-mono text-sm text-muted-foreground">
                    {appointment.date}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm font-medium">
                    {appointment.patientName}
                  </TableCell>
                  <TableCell className="max-w-xl whitespace-normal px-5 py-3.5 text-sm text-muted-foreground">
                    {appointment.visitReason || "No visit reason provided."}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                    {appointment.doctorName} &middot; {appointment.specialization}
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    <AppointmentStatusBadge
                      status={appointment.status ?? ""}
                      colorCode={appointment.statusColorCode}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onPrev}
              disabled={page <= 1}
              aria-label="Previous appointments page"
              title="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onNext}
              disabled={page >= totalPages}
              aria-label="Next appointments page"
              title="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
