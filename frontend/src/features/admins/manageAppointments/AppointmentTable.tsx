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
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide capitalize"
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
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3 text-muted-foreground">Time</TableHead>
              <TableHead className="px-4 py-3 text-muted-foreground">Date</TableHead>
              <TableHead className="px-4 py-3 text-muted-foreground">Patient</TableHead>
              <TableHead className="px-4 py-3 text-muted-foreground">Visit Reason</TableHead>
              <TableHead className="px-4 py-3 text-muted-foreground">Doctor</TableHead>
              <TableHead className="px-4 py-3 text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  Loading appointments...
                </TableCell>
              </TableRow>
            ) : appointments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground text-sm"
                >
                  No appointments found.
                </TableCell>
              </TableRow>
            ) : (
              appointments.map((appointment) => (
                <TableRow
                  key={appointment.publicId}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-4 py-3 font-mono text-foreground text-xs">
                    {formatLocalTime(appointment.startTime)}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-mono text-foreground text-xs">
                    {appointment.date}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {appointment.patientName}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                    {appointment.visitReason}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                    {appointment.doctorName} &middot; {appointment.specialization}
                  </TableCell>
                  <TableCell className="px-4 py-3">
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

      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onPrev}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onNext}
            disabled={page >= totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
