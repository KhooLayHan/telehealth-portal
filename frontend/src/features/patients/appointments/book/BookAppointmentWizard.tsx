import { useForm } from "@tanstack/react-form";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
} from "lucide-react";
import { $fetch } from "ofetch";
import { useState } from "react";
import { z } from "zod";

import { useCreate } from "@/api/generated/appointments/appointments";
import type { BookAppointmentCommand } from "@/api/model/BookAppointmentCommand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Constants & schema
// ---------------------------------------------------------------------------

const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;
type Severity = (typeof SEVERITY_OPTIONS)[number];

// FIX (symptom validation): Extracted as a top-level const so each sub-field
// can reference `symptomItemSchema.shape.<field>` directly as a validator,
// instead of duplicating inline schemas or passing `undefined`.
const symptomItemSchema = z.object({
  // Client-only stable key — stripped before the API call
  _id: z.string(),
  name: z.string().min(1, "Symptom name required").max(100, "Max 100 characters"),
  severity: z.enum(SEVERITY_OPTIONS, { error: "Select severity" }),
  duration: z.string().min(1, "Duration required (e.g., '3 days')").max(100, "Max 100 characters"),
});

const bookingSchema = z.object({
  schedulePublicId: z.string().min(1, "Please select a time slot."),
  visitReason: z.string().min(5, "Please provide a reason (min 5 characters).").max(500),
  // Re-uses the extracted schema so both the array-level and field-level
  // validators are always in sync with the backend BookAppointmentValidator.
  symptoms: z.array(symptomItemSchema).default([]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;
type WizardStep = 1 | 2;

// ---------------------------------------------------------------------------
// Schedule API
// ---------------------------------------------------------------------------

// Shape returned by GET /api/v1/schedules/available.
// `publicId` is the UUID that goes directly into BookAppointmentCommand.schedulePublicId.
// TODO: generate this type via orval once the schedule endpoint is spec-documented.
interface AvailableScheduleDto {
  publicId: string;
  startTime: string; // "HH:mm" — formatted server-side for display
  endTime: string;
}

// FIX (real slot IDs): Fetches genuine schedule rows from the database.
// The returned `publicId` values are real UUIDv7s that satisfy the backend's
// `FirstOrDefaultAsync(s => s.PublicId == cmd.SchedulePublicId)` lookup,
// replacing the placeholder strings that previously caused a 404.
const fetchAvailableSchedules = (
  date: string,
  doctorPublicId: string | undefined,
): Promise<AvailableScheduleDto[]> =>
  $fetch<AvailableScheduleDto[]>(
    // NOTE: update this path to match ApiEndpoints.Schedules.Available
    // once the schedule endpoint is registered on the router.
    "http://localhost:5144/api/v1/schedules/available",
    {
      query: {
        date,
        ...(doctorPublicId ? { doctorPublicId } : {}),
      },
    },
  );

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookAppointmentWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // FIX (real slot IDs): `selectedDoctorId` now holds a doctor public-ID UUID
  // (or empty string for "any doctor"). When either input changes the stale
  // `schedulePublicId` is cleared so the user cannot submit a slot that no
  // longer belongs to the new doctor/date combination.
  // TODO: populate this select from GET /api/v1/doctors once that endpoint exists.
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const bookMutation = useCreate();

  // FIX (real slot IDs): Query is enabled only when a date is chosen.
  // React Query re-fetches automatically whenever selectedDate or
  // selectedDoctorId changes, so the slot grid always reflects current
  // availability rather than stale dummy values.
  const {
    data: availableSchedules = [],
    isLoading: isLoadingSchedules,
    isError: isSchedulesError,
  } = useQuery({
    queryKey: ["schedules", "available", selectedDate, selectedDoctorId || null],
    queryFn: () => fetchAvailableSchedules(selectedDate, selectedDoctorId || undefined),
    enabled: !!selectedDate,
  });

  const defaultValues: BookingFormValues = {
    schedulePublicId: "",
    visitReason: "",
    symptoms: [],
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setBookingError(null);
      const payload: BookAppointmentCommand = {
        schedulePublicId: value.schedulePublicId,
        visitReason: value.visitReason,
        symptoms:
          value.symptoms.length > 0
            ? value.symptoms.map(({ name, severity, duration }) => ({
                name,
                severity,
                duration,
              }))
            : null,
      };
      try {
        await bookMutation.mutateAsync({ data: payload });
        setIsSuccess(true);
      } catch {
        setBookingError("Something went wrong confirming your booking. Please try again.");
      }
    },
  });

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="shadow-lg">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle2 className="size-12" />
            </div>
            <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
            <CardDescription className="max-w-xs mx-auto">
              Your appointment has been successfully booked. We've sent a confirmation email to your
              inbox.
            </CardDescription>
            <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className="mx-4 text-sm font-medium text-muted-foreground">Step {step} of 2</div>
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card className="shadow-lg">
          {step === 1 && (
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
                    {/* TODO: replace options with data from GET /api/v1/doctors */}
                    <select
                      id="doctor-select"
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm"
                      value={selectedDoctorId}
                      onChange={(e) => {
                        setSelectedDoctorId(e.target.value);
                        // FIX (real slot IDs): A doctor change means the
                        // current slot belongs to a different availability
                        // set — clear it so the old publicId is never submitted.
                        form.setFieldValue("schedulePublicId", "");
                      }}
                    >
                      <option value="">Any Available Doctor</option>
                      {/* Values must be doctor public-ID UUIDs once the lookup API is wired */}
                      <option value="01930000-0000-7000-0000-000000000001">
                        Dr. Sarah Chen (Cardiology)
                      </option>
                      <option value="01930000-0000-7000-0000-000000000002">
                        Dr. Ahmad Razak (General)
                      </option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-input">Select Date</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        id="date-input"
                        type="date"
                        className="pl-9"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          // FIX (real slot IDs): Date change invalidates
                          // the previously selected slot — clear it.
                          form.setFieldValue("schedulePublicId", "");
                        }}
                        min={minDate}
                      />
                    </div>
                  </div>
                </div>

                <form.Field
                  name="schedulePublicId"
                  validators={{
                    onChange: bookingSchema.shape.schedulePublicId,
                  }}
                >
                  {(field) => (
                    <fieldset
                      className="space-y-3 pt-4 border-t border-border"
                      aria-labelledby="time-slots-label"
                    >
                      <legend id="time-slots-label">Available Time Slots</legend>

                      {!selectedDate ? (
                        <p className="text-sm text-muted-foreground italic">
                          Please select a date first.
                        </p>
                      ) : isLoadingSchedules ? (
                        <p className="text-sm text-muted-foreground italic">
                          Loading available slots…
                        </p>
                      ) : isSchedulesError ? (
                        <p className="text-sm text-destructive" role="alert">
                          Could not load available slots. Please try again.
                        </p>
                      ) : availableSchedules.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">
                          No slots available for this date. Try another day.
                        </p>
                      ) : (
                        // FIX (real slot IDs): Each button's onClick now passes
                        // slot.publicId — a real database UUID — into the form
                        // field, so the value submitted matches what the backend
                        // expects in BookAppointmentCommand.SchedulePublicId.
                        <div className="grid grid-cols-3 gap-3">
                          {availableSchedules.map((slot) => (
                            <button
                              key={slot.publicId}
                              type="button"
                              aria-pressed={field.state.value === slot.publicId}
                              onClick={() => field.handleChange(slot.publicId)}
                              className={`flex flex-col items-center justify-center rounded-md border p-3 transition-all ${
                                field.state.value === slot.publicId
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <Clock className="mb-1 size-4" />
                              <span className="text-sm font-medium">{slot.startTime}</span>
                              <span className="text-xs text-muted-foreground">
                                – {slot.endTime}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}

                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </fieldset>
                  )}
                </form.Field>

                <div className="flex justify-end pt-6">
                  <form.Subscribe selector={(state) => state.values.schedulePublicId}>
                    {(scheduleId) => (
                      <Button type="button" onClick={() => setStep(2)} disabled={!scheduleId}>
                        Next Step <ChevronRight className="ml-2 size-4" />
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-2xl">Medical Details</CardTitle>
                <CardDescription>
                  Please describe your reason for visiting to help the doctor prepare.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form.Field
                  name="visitReason"
                  validators={{ onChange: bookingSchema.shape.visitReason }}
                >
                  {(field) => (
                    <div className="space-y-2">
                      <Label htmlFor={field.name}>
                        Reason for Visit{" "}
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      </Label>
                      <textarea
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="E.g., Experiencing severe headaches for the past 3 days."
                        aria-required
                        className="min-h-25 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Symptoms (Optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Add specific symptoms you are experiencing.
                      </p>
                    </div>
                    <form.Field name="symptoms">
                      {(field) => (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            field.pushValue({
                              _id: crypto.randomUUID(),
                              name: "",
                              severity: "Mild",
                              duration: "",
                            })
                          }
                        >
                          <Plus className="mr-1 size-3" /> Add Symptom
                        </Button>
                      )}
                    </form.Field>
                  </div>

                  <form.Field name="symptoms">
                    {(field) => (
                      <div className="space-y-3">
                        {field.state.value.map((symptom, i) => (
                          <div
                            key={symptom._id}
                            className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                          >
                            <div className="grid flex-1 gap-3 sm:grid-cols-3">
                              {/* FIX (symptom validation): each sub-field now
                                  has a validator referencing symptomItemSchema.shape,
                                  so incomplete rows are caught client-side before
                                  the backend's BookAppointmentValidator rejects them.
                                  Errors render inline below each input. */}
                              <form.Field
                                name={`symptoms[${i}].name`}
                                validators={{
                                  onChange: symptomItemSchema.shape.name,
                                }}
                              >
                                {(subField) => (
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`symptom-name-${symptom._id}`}
                                      className="text-xs"
                                    >
                                      Symptom
                                    </Label>
                                    <Input
                                      id={`symptom-name-${symptom._id}`}
                                      value={subField.state.value}
                                      onBlur={subField.handleBlur}
                                      onChange={(e) => subField.handleChange(e.target.value)}
                                      placeholder="Fever"
                                      aria-invalid={subField.state.meta.errors.length > 0}
                                    />
                                    {subField.state.meta.errors.length > 0 && (
                                      <p className="text-xs text-destructive">
                                        {subField.state.meta.errors[0]?.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </form.Field>

                              {/* Severity is a closed enum — invalid values are
                                  prevented by the select itself, but the
                                  validator still blocks programmatic bad data. */}
                              <form.Field
                                name={`symptoms[${i}].severity`}
                                validators={{
                                  onChange: symptomItemSchema.shape.severity,
                                }}
                              >
                                {(subField) => (
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`symptom-severity-${symptom._id}`}
                                      className="text-xs"
                                    >
                                      Severity
                                    </Label>
                                    <select
                                      id={`symptom-severity-${symptom._id}`}
                                      value={subField.state.value}
                                      onBlur={subField.handleBlur}
                                      onChange={(e) =>
                                        subField.handleChange(e.target.value as Severity)
                                      }
                                      className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                      {SEVERITY_OPTIONS.map((s) => (
                                        <option key={s} value={s}>
                                          {s}
                                        </option>
                                      ))}
                                    </select>
                                    {subField.state.meta.errors.length > 0 && (
                                      <p className="text-xs text-destructive">
                                        {subField.state.meta.errors[0]?.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </form.Field>

                              <form.Field
                                name={`symptoms[${i}].duration`}
                                validators={{
                                  onChange: symptomItemSchema.shape.duration,
                                }}
                              >
                                {(subField) => (
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`symptom-duration-${symptom._id}`}
                                      className="text-xs"
                                    >
                                      Duration
                                    </Label>
                                    <Input
                                      id={`symptom-duration-${symptom._id}`}
                                      value={subField.state.value}
                                      onBlur={subField.handleBlur}
                                      onChange={(e) => subField.handleChange(e.target.value)}
                                      placeholder="2 days"
                                      aria-invalid={subField.state.meta.errors.length > 0}
                                    />
                                    {subField.state.meta.errors.length > 0 && (
                                      <p className="text-xs text-destructive">
                                        {subField.state.meta.errors[0]?.message}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </form.Field>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={`Remove symptom ${symptom.name || i + 1}`}
                              className="text-destructive hover:bg-destructive/10 mt-5"
                              onClick={() => field.removeValue(i)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </form.Field>
                </div>

                {bookingError && (
                  <p className="text-sm text-destructive" role="alert">
                    {bookingError}
                  </p>
                )}

                <div className="flex justify-between pt-6 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 size-4" /> Back
                  </Button>

                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={!canSubmit || bookMutation.isPending}>
                        {isSubmitting || bookMutation.isPending
                          ? "Confirming..."
                          : "Confirm Booking"}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </form>
    </div>
  );
}
