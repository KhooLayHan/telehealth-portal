import { CalendarDays, Clock3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Describes the selected schedule slot and open state for the delete confirmation dialog.
interface DeleteScheduleDialogProps {
  open: boolean;
  scheduleSlot: ReceptionistDoctorScheduleSlotDto | null;
  onConfirm: (scheduleSlot: ReceptionistDoctorScheduleSlotDto) => void;
  onOpenChange: (open: boolean) => void;
}

// Formats a LocalDate value into a readable weekday and date label.
function formatDateLabel(date?: string): string {
  if (!date) {
    return "No date provided";
  }

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    weekday: "long",
    year: "numeric",
  });
}

// Formats a backend LocalTime value for display in the confirmation summary.
function formatTimeLabel(time?: string): string {
  return time ? time.slice(0, 5) : "Not provided";
}

// Displays a frontend-only confirmation dialog before removing a schedule slot from the view.
export function DeleteScheduleDialog({
  open,
  scheduleSlot,
  onConfirm,
  onOpenChange,
}: DeleteScheduleDialogProps) {
  if (!scheduleSlot) return null;

  const handleConfirm = () => {
    onConfirm(scheduleSlot);
    toast.success("Schedule removed from this view.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl font-semibold">Delete Schedule</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this schedule slot? This is a frontend-only removal
                until the backend delete endpoint is connected.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 px-6 pb-5">
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <span className="font-medium">{formatDateLabel(scheduleSlot.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <span>
                    {formatTimeLabel(scheduleSlot.startTime)} -{" "}
                    {formatTimeLabel(scheduleSlot.endTime)}
                  </span>
                </div>
              </div>
              <Badge className="w-fit" variant="secondary">
                {scheduleSlot.scheduleStatus ?? "Unknown"}
              </Badge>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Appointment</p>
                <p className="truncate">{scheduleSlot.appointmentStatus ?? "No appointment"}</p>
              </div>
              <div className="min-w-0">
                <p className="text-muted-foreground text-xs">Reason</p>
                <p className="truncate">{scheduleSlot.visitReason ?? "Not provided"}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm}>
            Delete Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
