import {
  CalendarClock,
  CalendarDays,
  Clock3,
  FileText,
  Hash,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Describes the minimum doctor information needed by the schedule dialog.
interface ScheduleDoctor {
  departmentName?: string | null;
  doctorPublicId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  licenseNumber?: string | null;
  specialization?: string | null;
}

// Describes a demo schedule slot shaped after the backend doctor schedule schema.
interface DemoDoctorScheduleSlot {
  appointmentPublicId?: string;
  appointmentStatus?: "Booked" | "Checked In" | "In Progress" | "Completed" | "Cancelled";
  createdAt: string;
  date: string;
  day: string;
  endTime: string;
  patientName?: string;
  publicId: string;
  scheduleStatus: "Available" | "Booked" | "Blocked";
  startTime: string;
  updatedAt?: string;
  visitReason?: string;
}

// Describes the selected doctor and open state for the schedule dialog.
interface ViewDoctorScheduleDialogProps {
  doctor: ScheduleDoctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Demo schedule slots used until the admin schedule API is connected.
const demoScheduleSlots: DemoDoctorScheduleSlot[] = [
  {
    appointmentPublicId: "9b7f6d49-3428-4e5a-a11c-6e0a6c94f421",
    appointmentStatus: "Booked",
    createdAt: "2026-04-20T09:12:00Z",
    date: "2026-04-28",
    day: "Tuesday",
    endTime: "09:30",
    patientName: "Aisha Rahman",
    publicId: "f7f9f8e2-8df0-48cf-a95a-1f4bcdbe6a01",
    scheduleStatus: "Booked",
    startTime: "09:00",
    updatedAt: "2026-04-22T02:40:00Z",
    visitReason: "Follow-up consultation",
  },
  {
    createdAt: "2026-04-20T09:15:00Z",
    date: "2026-04-28",
    day: "Tuesday",
    endTime: "10:00",
    publicId: "2e96a5a6-dc33-4c8d-8e30-48b7ad65574a",
    scheduleStatus: "Available",
    startTime: "09:30",
  },
  {
    appointmentPublicId: "4b53127b-cab9-4d68-9dd4-f4cb3b1e225f",
    appointmentStatus: "Checked In",
    createdAt: "2026-04-20T09:16:00Z",
    date: "2026-04-28",
    day: "Tuesday",
    endTime: "10:30",
    patientName: "Daniel Tan",
    publicId: "f9a80fe4-c8c6-423e-b2f1-b0f2fdb5010f",
    scheduleStatus: "Booked",
    startTime: "10:00",
    updatedAt: "2026-04-24T03:22:00Z",
    visitReason: "Medication review",
  },
  {
    createdAt: "2026-04-20T09:20:00Z",
    date: "2026-04-29",
    day: "Wednesday",
    endTime: "14:30",
    publicId: "49ca78b7-a6d2-4772-85f6-5b8947191e4a",
    scheduleStatus: "Blocked",
    startTime: "14:00",
    updatedAt: "2026-04-23T08:00:00Z",
    visitReason: "Department meeting",
  },
  {
    createdAt: "2026-04-20T09:22:00Z",
    date: "2026-04-29",
    day: "Wednesday",
    endTime: "15:00",
    publicId: "a3709622-c922-44a1-932b-4ab2d7ea1de2",
    scheduleStatus: "Available",
    startTime: "14:30",
  },
  {
    appointmentPublicId: "438fa7f0-5744-41f9-8215-3a3a0f42756b",
    appointmentStatus: "In Progress",
    createdAt: "2026-04-20T09:28:00Z",
    date: "2026-04-30",
    day: "Thursday",
    endTime: "11:30",
    patientName: "Mei Ling Wong",
    publicId: "c3f67f80-fb81-4430-8627-04dcab47f18a",
    scheduleStatus: "Booked",
    startTime: "11:00",
    updatedAt: "2026-04-25T04:10:00Z",
    visitReason: "Lab result discussion",
  },
];

// Formats an ISO timestamp for compact admin display.
function formatTimestamp(value?: string): string {
  if (!value) {
    return "Not updated";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-MY", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Calculates the slot duration from the schedule start and end times.
function getDurationLabel(startTime: string, endTime: string): string {
  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  return minutes > 0 ? `${minutes} min` : "Not provided";
}

// Returns the badge style for each schedule slot status.
function getScheduleStatusBadgeVariant(
  status: DemoDoctorScheduleSlot["scheduleStatus"],
): "default" | "destructive" | "secondary" {
  if (status === "Available") {
    return "default";
  }

  if (status === "Blocked") {
    return "destructive";
  }

  return "secondary";
}

// Returns the badge style for each appointment status.
function getAppointmentStatusBadgeVariant(
  status?: DemoDoctorScheduleSlot["appointmentStatus"],
): "default" | "destructive" | "outline" | "secondary" {
  if (status === "Cancelled") {
    return "destructive";
  }

  if (status === "Completed") {
    return "outline";
  }

  if (status === "Checked In" || status === "In Progress") {
    return "default";
  }

  return "secondary";
}

// Displays one compact summary metric for the current demo schedule.
function ScheduleMetric({
  label,
  value,
  icon: Icon,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-2 font-semibold text-lg leading-none">{value}</p>
    </div>
  );
}

// Displays the selected doctor's schedule using local demo data only.
export function ViewDoctorScheduleDialog({
  doctor,
  open,
  onOpenChange,
}: ViewDoctorScheduleDialogProps) {
  if (!doctor) return null;

  const doctorName = `Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  const bookedCount = demoScheduleSlots.filter((slot) => slot.scheduleStatus === "Booked").length;
  const availableCount = demoScheduleSlots.filter(
    (slot) => slot.scheduleStatus === "Available",
  ).length;
  const blockedCount = demoScheduleSlots.filter((slot) => slot.scheduleStatus === "Blocked").length;
  const nextBookedSlot = demoScheduleSlots.find((slot) => slot.scheduleStatus === "Booked");
  const groupedSlots = demoScheduleSlots.reduce<Record<string, DemoDoctorScheduleSlot[]>>(
    (groups, slot) => {
      const key = `${slot.day}, ${slot.date}`;
      groups[key] = [...(groups[key] ?? []), slot];
      return groups;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />

        <DialogHeader className="px-6 pb-5 pt-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <DialogTitle className="flex items-center gap-2 text-xl font-semibold leading-none">
                <CalendarClock className="size-5" />
                Doctor Schedule
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                View demo schedule slots, availability, and booked appointment details for{" "}
                <span className="font-medium text-foreground">{doctorName}</span>.
              </DialogDescription>
            </div>

            <Badge className="h-6" variant="outline">
              Demo data
            </Badge>
          </div>
        </DialogHeader>

        <div className="max-h-[68vh] overflow-y-auto px-6 pb-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScheduleMetric icon={CalendarDays} label="Total Slots" value="6" />
            <ScheduleMetric icon={Clock3} label="Available" value={String(availableCount)} />
            <ScheduleMetric icon={UserRound} label="Booked" value={String(bookedCount)} />
            <ScheduleMetric icon={FileText} label="Blocked" value={String(blockedCount)} />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/20 p-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Doctor</p>
              <p className="font-medium">{doctorName}</p>
              <p className="text-muted-foreground text-xs">
                {doctor.doctorPublicId ?? "No public ID"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Department</p>
              <p className="font-medium">{doctor.departmentName ?? "Not provided"}</p>
              <p className="text-muted-foreground text-xs">
                {doctor.specialization ?? "No specialization"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Next Booked Slot</p>
              <p className="font-medium">
                {nextBookedSlot
                  ? `${nextBookedSlot.day}, ${nextBookedSlot.startTime}`
                  : "No booked slots"}
              </p>
              <p className="text-muted-foreground text-xs">
                License {doctor.licenseNumber ?? "not provided"}
              </p>
            </div>
          </div>

          <Tabs defaultValue="table" className="mt-5">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="table">Schedule Slots</TabsTrigger>
              <TabsTrigger value="daily">Daily View</TabsTrigger>
            </TabsList>

            <TabsContent className="mt-4" value="table">
              <div className="overflow-hidden rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Appointment</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoScheduleSlots.map((slot) => (
                      <TableRow key={slot.publicId}>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{slot.day}</p>
                            <p className="text-muted-foreground text-xs">{slot.date}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {getDurationLabel(slot.startTime, slot.endTime)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getScheduleStatusBadgeVariant(slot.scheduleStatus)}>
                            {slot.scheduleStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {slot.appointmentStatus ? (
                            <Badge
                              variant={getAppointmentStatusBadgeVariant(slot.appointmentStatus)}
                            >
                              {slot.appointmentStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">No appointment</span>
                          )}
                        </TableCell>
                        <TableCell>{slot.patientName ?? "Not assigned"}</TableCell>
                        <TableCell className="max-w-52 truncate">
                          {slot.visitReason ?? "Not provided"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatTimestamp(slot.updatedAt ?? slot.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent className="mt-4 space-y-4" value="daily">
              {Object.entries(groupedSlots).map(([dateLabel, slots]) => (
                <section className="rounded-lg border border-border" key={dateLabel}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <h3 className="font-medium text-sm">{dateLabel}</h3>
                      <p className="text-muted-foreground text-xs">
                        {slots.length} slot{slots.length === 1 ? "" : "s"} scheduled
                      </p>
                    </div>
                    <Badge variant="outline">
                      {slots.filter((slot) => slot.scheduleStatus === "Available").length} open
                    </Badge>
                  </div>
                  <Separator />
                  <div className="divide-y divide-border">
                    {slots.map((slot) => (
                      <div
                        className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[10rem_8rem_1fr]"
                        key={slot.publicId}
                      >
                        <div className="flex items-center gap-2 font-medium text-sm">
                          <Clock3 className="size-4 text-muted-foreground" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <Badge
                          className="w-fit"
                          variant={getScheduleStatusBadgeVariant(slot.scheduleStatus)}
                        >
                          {slot.scheduleStatus}
                        </Badge>
                        <div className="min-w-0 space-y-1">
                          <p
                            className={cn(
                              "truncate text-sm",
                              !slot.patientName && "text-muted-foreground",
                            )}
                          >
                            {slot.patientName ?? slot.visitReason ?? "Open for booking"}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
                            <span className="inline-flex items-center gap-1">
                              <Hash className="size-3" />
                              Slot {slot.publicId}
                            </span>
                            {slot.appointmentPublicId && (
                              <span className="inline-flex items-center gap-1">
                                <Stethoscope className="size-3" />
                                Appointment {slot.appointmentPublicId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
