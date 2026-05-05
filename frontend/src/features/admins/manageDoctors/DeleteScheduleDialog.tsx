import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Clock3, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getGetDailySchedulesForReceptionistQueryKey,
  useDeleteById,
} from "@/api/generated/schedules/schedules";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { ApiError } from "@/api/ofetch-mutator";
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

// Checks whether the selected schedule can be removed.
function canRemoveScheduleSlot(scheduleSlot: ReceptionistDoctorScheduleSlotDto): boolean {
  return scheduleSlot.scheduleStatus?.toLowerCase() === "available";
}

// Displays a confirmation dialog before removing an available schedule slot.
export function DeleteScheduleDialog({
  open,
  scheduleSlot,
  onOpenChange,
}: DeleteScheduleDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useDeleteById();

  if (!scheduleSlot) return null;

  const isRemovable = canRemoveScheduleSlot(scheduleSlot);

  const handleConfirm = async () => {
    if (!scheduleSlot.publicId) {
      toast.error("Schedule ID is missing. Please refresh and try again.");
      return;
    }

    if (!isRemovable) {
      toast.error("Only available schedules can be removed.");
      return;
    }

    try {
      await mutateAsync({ id: scheduleSlot.publicId });
      await queryClient.invalidateQueries({
        queryKey: getGetDailySchedulesForReceptionistQueryKey({
          Date: scheduleSlot.date ?? "",
          DoctorPublicId: scheduleSlot.doctorPublicId,
        }),
      });
      toast.success("Schedule removed.");
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data?.title ?? "Failed to remove schedule.");
      } else {
        toast.error("Failed to remove schedule.");
      }
    }
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
                {isRemovable
                  ? "Are you sure you want to delete this schedule slot?"
                  : "Only available schedule slots can be removed."}
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
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!isRemovable || isPending}
            onClick={handleConfirm}
          >
            {isPending && <Loader2 className="size-3.5 animate-spin" />}
            {isPending ? "Deleting..." : "Delete Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
