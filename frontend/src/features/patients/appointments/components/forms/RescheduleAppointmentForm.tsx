import { useState } from "react";
import { useGetAllAvailable } from "@/api/generated/schedules/schedules";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormError } from "@/features/auth/components/FormError";
import { DatePicker } from "@/features/patients/book/components/ui/DatePicker";
import type { useRescheduleForm } from "../hooks/useRescheduleForm";

type RescheduleAppointmentFormProps = {
  form: RescheduleFormType;
  error: string | null;
  isPending: boolean;
  onClose: () => void;
};

export function RescheduleAppointmentForm({
  form,
  error,
  isPending,
  onClose,
}: RescheduleAppointmentFormProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const minDate = new Date().toISOString().split("T")[0];

  const { data: schedulesResponse, isLoading: isLoadingSchedules } = useGetAllAvailable(
    { Date: selectedDate },
    { query: { enabled: !!selectedDate } },
  );

  const availableSchedules =
    schedulesResponse?.status === 200 && Array.isArray(schedulesResponse.data)
      ? schedulesResponse.data
      : [];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4 pt-4"
    >
      {error && <FormError message={error} />}

      {/* <div className="space-y-2">
        <label htmlFor="date-input" className="text-sm font-medium">
          Select New Date
        </label>
        <Input
          id="date-input"
          type="date"
          min={minDate}
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            form.setFieldValue("newSchedulePublicId", "");
          }}
        />
      </div> */}

      <DatePicker
        value={selectedDate}
        minDate={minDate}
        onChange={(e) => {
          setSelectedDate(e);
          form.setFieldValue("newSchedulePublicId", "");
        }}
      />

      <form.Field name="newSchedulePublicId">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Available Slots</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value ?? "")}
              disabled={!selectedDate || isLoadingSchedules}
            >
              <SelectTrigger aria-invalid={field.state.meta.errors.length > 0}>
                <SelectValue
                  placeholder={
                    !selectedDate
                      ? "Please select a date first..."
                      : isLoadingSchedules
                        ? "Loading slots..."
                        : availableSchedules.length === 0
                          ? "No slots available for this date."
                          : "Select a new time..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {availableSchedules.map((slot) => (
                  <SelectItem
                    key={slot.publicId}
                    value={`${slot.startTime?.slice(0, 5)} - ${slot.endTime?.slice(0, 5)}`}
                  >
                    {slot.startTime?.slice(0, 5)} - {slot.endTime?.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <form.Subscribe>
          {(state: { canSubmit: boolean; isSubmitting: boolean }) => (
            <Button type="submit" disabled={!state.canSubmit || isPending}>
              {isPending ? "Updating..." : "Confirm Reschedule"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export type RescheduleFormType = ReturnType<typeof useRescheduleForm>["form"];
