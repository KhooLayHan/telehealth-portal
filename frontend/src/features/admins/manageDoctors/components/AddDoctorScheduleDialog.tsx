import { useForm } from "@tanstack/react-form";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
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
import { Textarea } from "@/components/ui/textarea";

const addDoctorScheduleSchema = z
  .object({
    date: z.string().min(1, "Required"),
    startTime: z.string().min(1, "Required"),
    endTime: z.string().min(1, "Required"),
    scheduleStatus: z.enum(["Available", "Blocked"]),
    note: z.string().max(200, "Max 200 characters"),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

// Represents the validated values collected by the local schedule form.
type AddDoctorScheduleFormValues = z.infer<typeof addDoctorScheduleSchema>;

// Describes the doctor context needed to create a frontend-only schedule slot.
interface AddScheduleDoctor {
  doctorPublicId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: string | null;
}

// Describes the add schedule dialog state and local submit callback.
interface AddDoctorScheduleDialogProps {
  defaultDate: string;
  doctor: AddScheduleDoctor | null;
  open: boolean;
  onAddSchedule: (schedule: ReceptionistDoctorScheduleSlotDto) => void;
  onOpenChange: (open: boolean) => void;
}

// Displays a frontend-only form for drafting a new doctor schedule slot.
export function AddDoctorScheduleDialog({
  defaultDate,
  doctor,
  open,
  onAddSchedule,
  onOpenChange,
}: AddDoctorScheduleDialogProps) {
  const doctorName = `Dr. ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}`.trim();
  const defaultValues: AddDoctorScheduleFormValues = {
    date: defaultDate,
    startTime: "09:00",
    endTime: "09:30",
    scheduleStatus: "Available",
    note: "",
  };
  const form = useForm({
    defaultValues,
    validators: { onSubmit: addDoctorScheduleSchema },
    onSubmit: async ({ value }) => {
      const localId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${value.date}-${value.startTime}-${Date.now()}`;

      onAddSchedule({
        publicId: `local-${localId}`,
        date: value.date,
        startTime: value.startTime,
        endTime: value.endTime,
        scheduleStatus: value.scheduleStatus,
        scheduleStatusColorCode: null,
        doctorPublicId: doctor?.doctorPublicId ?? undefined,
        doctorName,
        doctorSpecialization: doctor?.specialization ?? undefined,
        appointmentPublicId: null,
        patientName: null,
        visitReason: value.note || null,
        appointmentStatus: null,
        appointmentStatusColorCode: null,
      });

      toast.success("Schedule added locally. Backend save is not connected yet.");
      onOpenChange(false);
      form.reset();
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
                Create a local schedule slot for{" "}
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

            <form.Field name="endTime">
              {(field) => (
                <Field data-invalid={field.state.meta.errors.length > 0}>
                  <FieldLabel htmlFor={field.name}>End Time</FieldLabel>
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

          <form.Field name="note">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor={field.name}>Note</FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  placeholder="Optional note for this slot"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe>
              {(state: { canSubmit: boolean; isSubmitting: boolean }) => (
                <Button type="submit" disabled={!state.canSubmit || state.isSubmitting}>
                  Add Schedule
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
