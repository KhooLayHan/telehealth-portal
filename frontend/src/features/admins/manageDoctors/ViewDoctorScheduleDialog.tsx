import {
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useGetDailySchedulesForReceptionist } from "@/api/generated/schedules/schedules";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
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
import { addDays, getTodayStr } from "@/features/schedules/ScheduleUtils";
import { cn } from "@/lib/utils";
import { AddDoctorScheduleForm } from "./AddDoctorScheduleForm";
import { DeleteScheduleDialog } from "./DeleteScheduleDialog";

// Describes the minimum doctor information needed by the schedule dialog.
interface ScheduleDoctor {
  departmentName?: string | null;
  doctorPublicId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  licenseNumber?: string | null;
  specialization?: string | null;
}

// Describes the selected doctor and open state for the schedule dialog.
interface ViewDoctorScheduleDialogProps {
  doctor: ScheduleDoctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Calculates the slot duration from the schedule start and end times.
function getDurationLabel(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) {
    return "Not provided";
  }

  const [startHour = 0, startMinute = 0] = startTime.split(":").map(Number);
  const [endHour = 0, endMinute = 0] = endTime.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  return minutes > 0 ? `${minutes} min` : "Not provided";
}

// Returns the badge style for each schedule slot status.
function getScheduleStatusBadgeVariant(status?: string): "default" | "destructive" | "secondary" {
  const normalized = status?.toLowerCase();

  if (normalized === "available") {
    return "default";
  }

  if (normalized === "blocked") {
    return "destructive";
  }

  return "secondary";
}

// Returns the badge style for each appointment status.
function getAppointmentStatusBadgeVariant(
  status?: string | null,
): "default" | "destructive" | "outline" | "secondary" {
  const normalized = status?.toLowerCase();

  if (normalized === "cancelled") {
    return "destructive";
  }

  if (normalized === "completed") {
    return "outline";
  }

  if (normalized === "checked in" || normalized === "in progress") {
    return "default";
  }

  return "secondary";
}

// Converts a LocalDate string into a weekday label.
function getDayLabel(date?: string): string {
  if (!date) {
    return "No date";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-MY", { weekday: "long" });
}

// Formats the backend LocalTime string for compact table display.
function formatTime(time?: string): string {
  if (!time) {
    return "Not provided";
  }

  return time.slice(0, 5);
}

// Checks whether a backend status name matches an expected schedule status.
function isScheduleStatus(slot: ReceptionistDoctorScheduleSlotDto, status: string): boolean {
  return slot.scheduleStatus?.toLowerCase() === status;
}

// Checks whether the schedule slot can be removed by an admin.
function canRemoveScheduleSlot(slot: ReceptionistDoctorScheduleSlotDto): boolean {
  return isScheduleStatus(slot, "available");
}

// Builds a stable fallback key for schedule slots when generated types mark IDs optional.
function getSlotKey(slot: ReceptionistDoctorScheduleSlotDto): string {
  return slot.publicId ?? `${slot.doctorPublicId ?? "doctor"}-${slot.date}-${slot.startTime}`;
}

// Displays one compact summary metric for the current schedule.
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

// Displays one schedule slot in a stacked layout for narrow dialog widths.
function ScheduleSlotCard({
  slot,
  onRemove,
}: {
  onRemove: (slot: ReceptionistDoctorScheduleSlotDto) => void;
  slot: ReceptionistDoctorScheduleSlotDto;
}) {
  const canRemove = canRemoveScheduleSlot(slot);

  return (
    <article className="space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-sm">{getDayLabel(slot.date)}</p>
          <p className="text-muted-foreground text-xs">{slot.date}</p>
        </div>
        <Badge className="shrink-0" variant={getScheduleStatusBadgeVariant(slot.scheduleStatus)}>
          {slot.scheduleStatus ?? "Unknown"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Time</p>
          <p className="font-medium">
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </p>
          <p className="text-muted-foreground text-xs">
            {getDurationLabel(slot.startTime, slot.endTime)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Appointment</p>
          {slot.appointmentStatus ? (
            <Badge variant={getAppointmentStatusBadgeVariant(slot.appointmentStatus)}>
              {slot.appointmentStatus}
            </Badge>
          ) : (
            <p className="text-muted-foreground">No appointment</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Patient</p>
          <p className="truncate">{slot.patientName ?? "Not assigned"}</p>
        </div>
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Reason</p>
          <p className="truncate">{slot.visitReason ?? "Not provided"}</p>
        </div>
      </div>

      <Button
        className="w-full gap-1.5"
        disabled={!canRemove}
        size="sm"
        title={canRemove ? "Remove schedule" : "Only available schedules can be removed"}
        type="button"
        variant="destructive"
        onClick={() => onRemove(slot)}
      >
        <Trash2 className="size-3.5" />
        Remove Schedule
      </Button>
    </article>
  );
}

// Displays the selected doctor's schedule from the backend daily schedule endpoint.
export function ViewDoctorScheduleDialog({
  doctor,
  open,
  onOpenChange,
}: ViewDoctorScheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [addScheduleOpen, setAddScheduleOpen] = useState(false);
  const [deleteScheduleOpen, setDeleteScheduleOpen] = useState(false);
  const [selectedScheduleSlot, setSelectedScheduleSlot] =
    useState<ReceptionistDoctorScheduleSlotDto | null>(null);
  const doctorPublicId = doctor?.doctorPublicId ?? "";
  const scheduleQuery = useGetDailySchedulesForReceptionist(
    { Date: selectedDate, ...(doctorPublicId ? { DoctorPublicId: doctorPublicId } : {}) },
    { query: { enabled: open && Boolean(doctorPublicId) } },
  );
  const backendScheduleSlots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
    () => (scheduleQuery.data?.status === 200 ? scheduleQuery.data.data : []),
    [scheduleQuery.data],
  );
  const scheduleSlots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
    () => backendScheduleSlots,
    [backendScheduleSlots],
  );
  const doctorName = `Dr. ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim();
  const hasLoadError = scheduleQuery.isError || scheduleQuery.data?.status === 401;
  const bookedCount = scheduleSlots.filter(
    (slot) => isScheduleStatus(slot, "booked") || Boolean(slot.patientName),
  ).length;
  const availableCount = scheduleSlots.filter((slot) => isScheduleStatus(slot, "available")).length;
  const blockedCount = scheduleSlots.filter((slot) => isScheduleStatus(slot, "blocked")).length;
  const nextBookedSlot = scheduleSlots.find(
    (slot) => isScheduleStatus(slot, "booked") || Boolean(slot.patientName),
  );
  const groupedSlots = scheduleSlots.reduce<Record<string, ReceptionistDoctorScheduleSlotDto[]>>(
    (groups, slot) => {
      const key = `${getDayLabel(slot.date)}, ${slot.date ?? selectedDate}`;
      groups[key] = [...(groups[key] ?? []), slot];
      return groups;
    },
    {},
  );
  const handleRequestRemoveScheduleSlot = (slot: ReceptionistDoctorScheduleSlotDto) => {
    if (!canRemoveScheduleSlot(slot)) {
      return;
    }

    setSelectedScheduleSlot(slot);
    setDeleteScheduleOpen(true);
  };
  const handleDeleteScheduleOpenChange = (nextOpen: boolean) => {
    setDeleteScheduleOpen(nextOpen);

    if (!nextOpen) {
      setSelectedScheduleSlot(null);
    }
  };

  if (!doctor) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[calc(100vh-2rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl xl:max-w-7xl">
          <div className="absolute inset-x-0 top-0 h-px bg-border" />

          <DialogHeader className="px-4 pb-5 pt-7 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <DialogTitle className="flex items-center gap-2 text-xl font-semibold leading-none">
                  <CalendarClock className="size-5" />
                  Doctor Schedule
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  View schedule slots, availability, and booked appointment details for{" "}
                  <span className="font-medium text-foreground">{doctorName}</span>.
                </DialogDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  className="h-8 gap-1.5 bg-black text-white hover:bg-black/85"
                  type="button"
                  onClick={() => setAddScheduleOpen(true)}
                >
                  <Plus className="size-4" />
                  Add Schedule
                </Button>
                <Button
                  aria-label="Previous day"
                  className="size-8"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDate((date) => addDays(date, -1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-2">
                  <CalendarDays className="size-3.5 text-muted-foreground" />
                  <input
                    className="bg-transparent font-mono text-xs outline-none"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                  />
                </div>
                <Button
                  aria-label="Next day"
                  className="size-8"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDate((date) => addDays(date, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 sm:px-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <ScheduleMetric
                icon={CalendarDays}
                label="Total Slots"
                value={String(scheduleSlots.length)}
              />
              <ScheduleMetric icon={Clock3} label="Available" value={String(availableCount)} />
              <ScheduleMetric icon={UserRound} label="Booked" value={String(bookedCount)} />
              <ScheduleMetric icon={FileText} label="Blocked" value={String(blockedCount)} />
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:grid-cols-3">
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-xs">Doctor</p>
                <p className="font-medium">{doctorName}</p>
                <p className="break-all text-muted-foreground text-xs">
                  {doctor.doctorPublicId ?? "No public ID"}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-xs">Department</p>
                <p className="font-medium">{doctor.departmentName ?? "Not provided"}</p>
                <p className="text-muted-foreground text-xs">
                  {doctor.specialization ?? "No specialization"}
                </p>
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-muted-foreground text-xs">Next Booked Slot</p>
                <p className="font-medium">
                  {nextBookedSlot
                    ? `${getDayLabel(nextBookedSlot.date)}, ${formatTime(nextBookedSlot.startTime)}`
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
                {scheduleQuery.isLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading schedule slots...
                  </div>
                ) : hasLoadError ? (
                  <p className="py-12 text-center text-destructive text-sm">
                    Failed to load schedule slots.
                  </p>
                ) : scheduleSlots.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground text-sm">
                    No schedule slots found for this date.
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 lg:hidden">
                      {scheduleSlots.map((slot) => (
                        <ScheduleSlotCard
                          key={getSlotKey(slot)}
                          slot={slot}
                          onRemove={handleRequestRemoveScheduleSlot}
                        />
                      ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
                      <Table className="min-w-[62rem]">
                        <TableHeader>
                          <TableRow className="bg-muted/40 hover:bg-muted/40">
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Appointment</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {scheduleSlots.map((slot) => (
                            <TableRow key={getSlotKey(slot)}>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">{getDayLabel(slot.date)}</p>
                                  <p className="text-muted-foreground text-xs">{slot.date}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {getDurationLabel(slot.startTime, slot.endTime)}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getScheduleStatusBadgeVariant(slot.scheduleStatus)}>
                                  {slot.scheduleStatus ?? "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {slot.appointmentStatus ? (
                                  <Badge
                                    variant={getAppointmentStatusBadgeVariant(
                                      slot.appointmentStatus,
                                    )}
                                  >
                                    {slot.appointmentStatus}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    No appointment
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{slot.patientName ?? "Not assigned"}</TableCell>
                              <TableCell className="max-w-52 truncate">
                                {slot.visitReason ?? "Not provided"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  className="gap-1.5"
                                  disabled={!canRemoveScheduleSlot(slot)}
                                  size="sm"
                                  title={
                                    canRemoveScheduleSlot(slot)
                                      ? "Remove schedule"
                                      : "Only available schedules can be removed"
                                  }
                                  type="button"
                                  variant="destructive"
                                  onClick={() => handleRequestRemoveScheduleSlot(slot)}
                                >
                                  <Trash2 className="size-3.5" />
                                  Remove Schedule
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent className="mt-4 space-y-4" value="daily">
                {scheduleQuery.isLoading ? (
                  <div className="flex min-h-40 items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading schedule slots...
                  </div>
                ) : hasLoadError ? (
                  <p className="py-12 text-center text-destructive text-sm">
                    Failed to load schedule slots.
                  </p>
                ) : scheduleSlots.length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground text-sm">
                    No schedule slots found for this date.
                  </p>
                ) : (
                  Object.entries(groupedSlots).map(([dateLabel, slots]) => (
                    <section className="rounded-lg border border-border" key={dateLabel}>
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <h3 className="font-medium text-sm">{dateLabel}</h3>
                          <p className="text-muted-foreground text-xs">
                            {slots.length} slot{slots.length === 1 ? "" : "s"} scheduled
                          </p>
                        </div>
                        <Badge variant="outline">
                          {slots.filter((slot) => isScheduleStatus(slot, "available")).length} open
                        </Badge>
                      </div>
                      <Separator />
                      <div className="divide-y divide-border">
                        {slots.map((slot) => (
                          <div
                            className="grid grid-cols-1 gap-3 px-4 py-3 md:grid-cols-[10rem_8rem_1fr_auto]"
                            key={getSlotKey(slot)}
                          >
                            <div className="flex items-center gap-2 font-medium text-sm">
                              <Clock3 className="size-4 text-muted-foreground" />
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </div>
                            <Badge
                              className="w-fit"
                              variant={getScheduleStatusBadgeVariant(slot.scheduleStatus)}
                            >
                              {slot.scheduleStatus ?? "Unknown"}
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
                                {slot.appointmentPublicId && (
                                  <span className="inline-flex items-center gap-1">
                                    <Stethoscope className="size-3" />
                                    Appointment {slot.appointmentPublicId}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              className="w-full gap-1.5 md:w-auto"
                              disabled={!canRemoveScheduleSlot(slot)}
                              size="sm"
                              title={
                                canRemoveScheduleSlot(slot)
                                  ? "Remove schedule"
                                  : "Only available schedules can be removed"
                              }
                              type="button"
                              variant="destructive"
                              onClick={() => handleRequestRemoveScheduleSlot(slot)}
                            >
                              <Trash2 className="size-3.5" />
                              Remove Schedule
                            </Button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                )}
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

      <AddDoctorScheduleForm
        key={`${doctorPublicId}-${selectedDate}`}
        defaultDate={selectedDate}
        doctor={doctor}
        open={addScheduleOpen}
        onOpenChange={setAddScheduleOpen}
      />

      <DeleteScheduleDialog
        open={deleteScheduleOpen}
        scheduleSlot={selectedScheduleSlot}
        onOpenChange={handleDeleteScheduleOpenChange}
      />
    </>
  );
}
