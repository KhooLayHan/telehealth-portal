import type { AvailableScheduleDto } from "@/api/model/AvailableScheduleDto";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { BookingFormInstance } from "../../schema";
import { bookingSchema, isValidSlot } from "../../schema";
import { TimeSlotGrid } from "../ui/TimeSlotGrid";

interface ScheduleTimeSlotFieldProps {
  form: BookingFormInstance;
  availableSchedules: AvailableScheduleDto[];
  isLoading: boolean;
  isError: boolean;
}

export function ScheduleTimeSlotField({
  form,
  availableSchedules,
  isLoading,
  isError,
}: ScheduleTimeSlotFieldProps) {
  if (!isLoading && !isError && availableSchedules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No slots available for this date. Try another day.
      </p>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Could not load available slots. Please try again.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground italic">Loading available slots…</p>;
  }

  const validSlots = availableSchedules.filter(isValidSlot);

  return (
    <form.Field
      name="schedulePublicId"
      validators={{ onChange: bookingSchema.shape.schedulePublicId }}
    >
      {(field) => (
        <fieldset
          className="space-y-3 pt-4 border-t border-border"
          aria-labelledby="time-slots-label"
        >
          <legend id="time-slots-label" className="text-sm font-medium leading-none">
            Available Time Slots
          </legend>

          <TimeSlotGrid
            slots={validSlots}
            selectedId={field.state.value}
            onSelect={(id) => field.handleChange(id)}
          />

          {field.state.meta.errors.length > 0 && (
            <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
          )}
        </fieldset>
      )}
    </form.Field>
  );
}

interface ScheduleStepContentProps {
  form: BookingFormInstance;
  availableSchedules: AvailableScheduleDto[];
  isLoading: boolean;
  isError: boolean;
}

export function ScheduleStepContent({
  form,
  availableSchedules,
  isLoading,
  isError,
}: ScheduleStepContentProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Choose a Time</CardTitle>
        <CardDescription>
          Select your preferred doctor, date, and available time slot.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doctor-select">Select Doctor</Label>
            <div id="doctor-select-container">{/* DoctorSelect injected by parent */}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date-input">Select Date</Label>
            <div id="date-picker-container">{/* DatePicker injected by parent */}</div>
          </div>
        </div>

        <ScheduleTimeSlotField
          form={form}
          availableSchedules={availableSchedules}
          isLoading={isLoading}
          isError={isError}
        />
      </CardContent>
    </>
  );
}
