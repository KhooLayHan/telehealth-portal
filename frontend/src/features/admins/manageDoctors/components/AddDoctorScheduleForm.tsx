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
import type { AdminOperatingHourDto } from "@/api/model/AdminOperatingHourDto";
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
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PAST_DATE_VALIDATION_MESSAGE = "Choose today or a future date.";

// Returns today's local calendar date in the browser date input format.
function getTodayDateInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Checks whether a browser date input value is earlier than today.
function isPastDateInputValue(date: string): boolean {
  return DATE_INPUT_PATTERN.test(date) && date < getTodayDateInputValue();
}

const addDoctorScheduleSchema = z.object({
  date: z
    .string()
    .min(1, "Required")
    .refine((date) => !isPastDateInputValue(date), PAST_DATE_VALIDATION_MESSAGE),
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

// Describes the values needed to validate a slot against clinic operating hours.
interface OperatingHoursValidationInput {
  date: string;
  endTime: string;
  operatingHours: AdminOperatingHourDto[];
  startTime: string;
}

// Converts LocalTime values from the API into browser time input values.
function toTimeInput(value?: null | string): string {
  return value?.slice(0, 5) ?? "";
}

// Returns the API day-of-week number for a browser date input value.
function getApiDayOfWeek(date: string): null | number {
  if (!DATE_INPUT_PATTERN.test(date)) return null;

  const [year, month, day] = date.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return utcDay === 0 ? 7 : utcDay;
}

// Finds the configured operating hours for the selected calendar day.
function getOperatingHourForDate(
  date: string,
  operatingHours: AdminOperatingHourDto[],
): AdminOperatingHourDto | null {
  const dayOfWeek = getApiDayOfWeek(date);

  if (dayOfWeek === null) return null;

  return operatingHours.find((hour) => Number(hour.dayOfWeek) === dayOfWeek) ?? null;
}

// Builds the validation message when a schedule is outside operating hours.
function getOperatingHoursValidationMessage({
  date,
  endTime,
  operatingHours,
  startTime,
}: OperatingHoursValidationInput): string | undefined {
  if (!(date && startTime && endTime)) return undefined;

  if (getApiDayOfWeek(date) === null) {
    return "Choose a valid date.";
  }

  if (isPastDateInputValue(date)) {
    return PAST_DATE_VALIDATION_MESSAGE;
  }

  const dayOperatingHours = getOperatingHourForDate(date, operatingHours);

  if (!dayOperatingHours?.isOpen) {
    return "Clinic is closed on this day.";
  }

  const openTime = toTimeInput(dayOperatingHours.openTime);
  const closeTime = toTimeInput(dayOperatingHours.closeTime);
  const openMinutes = getTimeInputMinutes(openTime);
  const closeMinutes = getTimeInputMinutes(closeTime);
  const startMinutes = getTimeInputMinutes(startTime);
  const endMinutes = getTimeInputMinutes(endTime);

  if (
    openMinutes === null ||
    closeMinutes === null ||
    startMinutes === null ||
    endMinutes === null
  ) {
    return "Operating hours settings could not be validated.";
  }

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    return `Choose a time between ${openTime} and ${closeTime}.`;
  }

  return undefined;
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
      ? Number(settingsQuery.data.data.defaultAppointmentDurationMinutes)
      : null;
  const operatingHours =
    settingsQuery.data?.status === 200 ? settingsQuery.data.data.operatingHours : [];
  const doctorName = `Dr. ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim();
  const defaultValues: AddDoctorScheduleFormValues = {
    date: defaultDate,
    startTime: DEFAULT_START_TIME,
    scheduleStatus: "Available",
  };
  const minimumScheduleDate = getTodayDateInputValue();
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

      const operatingHoursError = getOperatingHoursValidationMessage({
        date: value.date,
        endTime,
        operatingHours,
        startTime: value.startTime,
      });

      if (operatingHoursError) {
        toast.error(operatingHoursError);
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
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CalendarPlus className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">Add Schedule</DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Create a schedule slot for{" "}
                <span className="font-medium text-foreground">{doctorName}</span>.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          className="flex flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 pb-6">
            <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
              Schedule Details
            </p>

            <form.Field name="date">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                  <Input
                    id={field.name}
                    min={minimumScheduleDate}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Slot Timing
              </p>
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
                    const endTime = getSlotEndTime(
                      state.values.startTime,
                      appointmentDurationMinutes,
                    );
                    const operatingHoursError = getOperatingHoursValidationMessage({
                      date: state.values.date,
                      endTime,
                      operatingHours,
                      startTime: state.values.startTime,
                    });
                    const endTimeError = settingsQuery.isError
                      ? "Appointment duration settings could not be loaded."
                      : appointmentDurationMinutes && !endTime
                        ? "Choose an earlier start time."
                        : operatingHoursError;

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
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe>
              {(state) => {
                const endTime = getSlotEndTime(state.values.startTime, appointmentDurationMinutes);
                const operatingHoursError = getOperatingHoursValidationMessage({
                  date: state.values.date,
                  endTime,
                  operatingHours,
                  startTime: state.values.startTime,
                });
                const isSettingsUnavailable =
                  settingsQuery.isLoading ||
                  !appointmentDurationMinutes ||
                  !endTime ||
                  !!operatingHoursError;

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
