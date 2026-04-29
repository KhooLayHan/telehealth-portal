import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminGetSettings } from "@/api/generated/admins/admins";
import {
  getGetDailySchedulesForReceptionistQueryKey,
  useCreateSchedule,
} from "@/api/generated/schedules/schedules";
import type { CreateScheduleCommand } from "@/api/model/CreateScheduleCommand";
import { ApiError } from "@/api/ofetch-mutator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_START_TIME = "09:00";
const MINUTES_PER_DAY = 24 * 60;
const SCHEDULE_SETTINGS_STALE_TIME_MS = 5 * 60 * 1000;
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const addDoctorScheduleSchema = z.object({
  date: z.string().min(1, "Required"),
  startTime: z.string().min(1, "Required"),
  scheduleStatus: z.enum(["Available", "Blocked"]),
});

// Converts browser time input values into the LocalTime format expected by the API.
function normalizeLocalTimeForApi(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

// Converts a browser time input value into minutes after midnight.
function getTimeInputMinutes(time: string): number | null {
  if (!TIME_INPUT_PATTERN.test(time)) return null;

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Formats minutes after midnight back into a browser time input value.
function formatTimeInput(minutesAfterMidnight: number): string {
  const hours = Math.floor(minutesAfterMidnight / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (minutesAfterMidnight % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

// Calculates the end time for a same-day appointment slot.
function getSlotEndTime(startTime: string, durationMinutes: null | number): string {
  const startMinutes = getTimeInputMinutes(startTime);

  if (startMinutes === null || durationMinutes === null || durationMinutes <= 0) {
    return "";
  }

  const endMinutes = startMinutes + durationMinutes;

  return endMinutes >= MINUTES_PER_DAY ? "" : formatTimeInput(endMinutes);
}

// Represents the validated values collected by the local schedule form.
type AddDoctorScheduleFormValues = z.infer<typeof addDoctorScheduleSchema>;

// Describes the doctor context needed to create a schedule slot.
interface AddScheduleDoctor {
  doctorPublicId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: string | null;
}

// Describes the add schedule form state and open-state callback.
interface AddDoctorScheduleFormProps {
  defaultDate: string;
  doctor: AddScheduleDoctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Displays a form for creating a doctor schedule slot.
export function AddDoctorScheduleForm({
  defaultDate,
  doctor,
  open,
  onOpenChange,
}: AddDoctorScheduleFormProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateSchedule();
  const settingsQuery = useAdminGetSettings({
    query: {
      enabled: open,
      staleTime: SCHEDULE_SETTINGS_STALE_TIME_MS,
    },
  });
  const appointmentDurationMinutes =
    settingsQuery.data?.status === 200
      ? settingsQuery.data.data.defaultAppointmentDurationMinutes
      : null;
  const doctorName = `Dr. ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim();
  const defaultValues: AddDoctorScheduleFormValues = {
    date: defaultDate,
    startTime: DEFAULT_START_TIME,
    scheduleStatus: "Available",
  };
  const form = useForm({
    defaultValues,
    validators: { onSubmit: addDoctorScheduleSchema },
    onSubmit: async ({ value }) => {
      if (!doctor?.doctorPublicId) {
        toast.error("Doctor ID is missing. Please refresh and try again.");
        return;
      }

      const endTime = getSlotEndTime(value.startTime, appointmentDurationMinutes);

      if (!appointmentDurationMinutes) {
        toast.error("Appointment duration settings could not be loaded.");
        return;
      }

      if (!endTime) {
        toast.error("Choose an earlier start time for this appointment duration.");
        return;
      }

      const payload: CreateScheduleCommand = {
        doctorPublicId: doctor.doctorPublicId,
        date: value.date,
        startTime: normalizeLocalTimeForApi(value.startTime),
        endTime: normalizeLocalTimeForApi(endTime),
        scheduleStatus: value.scheduleStatus.toLowerCase(),
      };

      try {
        await mutateAsync({ data: payload });
        await queryClient.invalidateQueries({
          queryKey: getGetDailySchedulesForReceptionistQueryKey({
            Date: value.date,
            DoctorPublicId: doctor.doctorPublicId,
          }),
        });
        toast.success(`Schedule added for ${doctorName}.`);
        onOpenChange(false);
        form.reset();
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data?.title ?? "Failed to add schedule.");
        } else {
          toast.error("Failed to add schedule.");
        }
      }
    },
  });

  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <CalendarPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-none">Add Schedule</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Create a schedule slot for{" "}
                <span className="font-medium text-foreground">{doctorName}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          className="space-y-4 px-6 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="date">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <form.Field name="startTime">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>Start Time</FieldLabel>
                  <Input
                    id={field.name}
                    type="time"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Subscribe>
              {(state) => {
                const endTime = getSlotEndTime(state.values.startTime, appointmentDurationMinutes);
                const endTimeError = settingsQuery.isError
                  ? "Appointment duration settings could not be loaded."
                  : appointmentDurationMinutes && !endTime
                    ? "Choose an earlier start time."
                    : undefined;

                return (
                  <Field data-invalid={!!endTimeError}>
                    <FieldLabel htmlFor="endTime">End Time</FieldLabel>
                    <Input
                      aria-invalid={!!endTimeError}
                      disabled
                      id="endTime"
                      readOnly
                      type="time"
                      value={endTime}
                    />
                    <FieldError errors={endTimeError ? [{ message: endTimeError }] : []} />
                  </Field>
                );
              }}
            </form.Subscribe>
          </div>

          <form.Field name="scheduleStatus">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Status</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value === "Blocked" ? "Blocked" : "Available")
                  }
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={field.state.meta.errors.length > 0}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => {
                const endTime = getSlotEndTime(state.values.startTime, appointmentDurationMinutes);
                const isSettingsUnavailable =
                  settingsQuery.isLoading || !appointmentDurationMinutes || !endTime;

                return (
                  <Button
                    type="submit"
                    disabled={
                      !state.canSubmit || state.isSubmitting || isPending || isSettingsUnavailable
                    }
                  >
                    {state.isSubmitting || isPending ? "Adding..." : "Add Schedule"}
                  </Button>
                );
              }}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
