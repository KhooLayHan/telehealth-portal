// src/features/appointments/book/ScheduleStep.tsx

import { Calendar as CalendarIcon, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { useGetAll } from "@/api/generated/doctors/doctors";
import { useGetAllAvailable } from "@/api/generated/schedules/schedules";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormInstance } from "./schema";
import { bookingSchema } from "./schema";

interface ScheduleStepProps {
  form: BookingFormInstance;
  onNext: () => void;
}

// Formats a NodaTime LocalTime string ("HH:mm:ss") to display form ("HH:mm").
export const formatLocalTime = (t: string): string => t.slice(0, 5);

const today = new Date();
// Pre-computed once so it doesn't re-run on every render.
const MIN_DATE = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

export function ScheduleForm({ form, onNext }: ScheduleStepProps) {
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const { data: doctors = [], isLoading: isLoadingDoctors } = useGetAll();

  const {
    data: availableSchedules = [],
    isLoading: isLoadingSchedules,
    isError: isSchedulesError,
  } = useGetAllAvailable(selectedDate, selectedDoctorId);

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
          {/* Doctor select — populated from GET /api/v1/doctors */}
          <div className="space-y-2">
            <Label htmlFor="doctor-select">Select Doctor</Label>
            <select
              id="doctor-select"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm"
              value={selectedDoctorId}
              disabled={isLoadingDoctors}
              onChange={(e) => {
                setSelectedDoctorId(e.target.value);
                // Changing the doctor invalidates the current slot — a slot
                // that belongs to Dr. A cannot be booked under Dr. B.
                form.setFieldValue("schedulePublicId", "");
              }}
            >
              <option value="">{isLoadingDoctors ? "Loading…" : "Any Available Doctor"}</option>
              {doctors.map((d) => (
                <option key={d.doctorPublicId} value={d.doctorPublicId}>
                  Dr. {d.firstName} {d.lastName} — {d.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label htmlFor="date-input">Select Date</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="date-input"
                type="date"
                className="pl-9"
                value={selectedDate}
                min={MIN_DATE}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  // Changing the date means the previously selected slot no
                  // longer exists in the new result set — clear it.
                  form.setFieldValue("schedulePublicId", "");
                }}
              />
            </div>
          </div>
        </div>

        {/* Time slot grid — bound to the form field that goes to the API */}
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

              {!selectedDate ? (
                <p className="text-sm text-muted-foreground italic">Please select a date first.</p>
              ) : isLoadingSchedules ? (
                <p className="text-sm text-muted-foreground italic">Loading available slots…</p>
              ) : isSchedulesError ? (
                <p className="text-sm text-destructive" role="alert">
                  Could not load available slots. Please try again.
                </p>
              ) : availableSchedules.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No slots available for this date. Try another day.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {availableSchedules.map((slot) => {
                    const isSelected = field.state.value === slot.publicId;
                    return (
                      <button
                        key={slot.publicId}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => field.handleChange(slot.publicId)}
                        className={`flex flex-col items-center justify-center rounded-md border p-3 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <Clock className="mb-1 size-4" />
                        <span className="text-sm font-medium">
                          {formatLocalTime(slot.startTime)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          – {formatLocalTime(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {field.state.meta.errors.length > 0 && (
                <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
              )}
            </fieldset>
          )}
        </form.Field>

        <div className="flex justify-end pt-6">
          <form.Subscribe selector={(state) => state.values.schedulePublicId}>
            {(scheduleId) => (
              <Button type="button" onClick={onNext} disabled={!scheduleId}>
                Next Step <ChevronRight className="ml-2 size-4" />
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </>
  );
}
