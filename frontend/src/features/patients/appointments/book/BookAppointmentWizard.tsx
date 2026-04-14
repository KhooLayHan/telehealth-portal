// src/features/appointments/BookAppointmentWizard.tsx

import { useForm } from "@tanstack/react-form";
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
import { useState } from "react";
import { z } from "zod";

import { useCreate } from "@/api/generated/appointments/appointments";
import type { BookAppointmentCommand } from "@/api/model/BookAppointmentCommand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// FIX: Severity options as a const to avoid duplication between schema and JSX
const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;
type Severity = (typeof SEVERITY_OPTIONS)[number];

const bookingSchema = z.object({
  schedulePublicId: z.string().min(1, "Please select a time slot."),
  visitReason: z.string().min(5, "Please provide a reason (min 5 characters).").max(500),
  symptoms: z
    .array(
      z.object({
        // FIX: Added a client-side `_id` for stable React keys (not sent to API)
        _id: z.string(),
        name: z.string().min(1, "Symptom name required"),
        severity: z.enum(SEVERITY_OPTIONS, {
          error: "Select severity",
        }),
        duration: z.string().min(1, "Duration required (e.g., '3 days')"),
      }),
    )
    .default([]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// FIX: Separated step navigation (1|2) from success state (boolean).
// Step 3 was really a different screen, not a booking step.
type WizardStep = 1 | 2;

// --- DUMMY DATA FOR UI TESTING ---
const DUMMY_SCHEDULES = [
  { id: "01hgw-morning", time: "09:00 AM" },
  { id: "01hgw-mid", time: "10:30 AM" },
  { id: "01hgw-afternoon", time: "02:00 PM" },
];

export function BookAppointmentWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<WizardStep>(1);
  // FIX: Success is a separate boolean, not a third "step"
  const [isSuccess, setIsSuccess] = useState(false);
  // FIX: Booking error surfaced to the user instead of console.error
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  // FIX: Correct hook name from generated file
  const bookMutation = useCreate();

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
      {/* Progress Bar — now only reflects real steps 1 and 2 */}
      <div className="mb-8 flex items-center justify-between">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className="mx-4 text-sm font-medium text-muted-foreground">Step {step} of 2</div>
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      {/* FIX: Single <form> wrapping the whole wizard so both steps
          are inside one form. Navigation between steps does not submit. */}
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
                  {/* FIX: Added `id` + `htmlFor` pairing on all labels and selects */}
                  <div className="space-y-2">
                    <Label htmlFor="doctor-select">Select Doctor</Label>
                    <select
                      id="doctor-select"
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm"
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                    >
                      <option value="">Any Available Doctor</option>
                      <option value="dr-sarah">Dr. Sarah Chen (Cardiology)</option>
                      <option value="dr-ahmad">Dr. Ahmad Razak (General)</option>
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
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
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
                    <div
                      className="space-y-3 pt-4 border-t border-border"
                      role="group"
                      aria-labelledby="time-slots-label"
                    >
                      <Label id="time-slots-label">Available Time Slots</Label>
                      {!selectedDate ? (
                        <p className="text-sm text-muted-foreground italic">
                          Please select a date first.
                        </p>
                      ) : (
                        <div className="grid grid-cols-3 gap-3">
                          {DUMMY_SCHEDULES.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              aria-pressed={field.state.value === slot.id}
                              onClick={() => field.handleChange(slot.id)}
                              className={`flex flex-col items-center justify-center rounded-md border p-3 transition-all ${
                                field.state.value === slot.id
                                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                                  : "border-border hover:border-primary/50 hover:bg-muted/50"
                              }`}
                            >
                              <Clock className="mb-1 size-4" />
                              <span className="text-sm font-medium">{slot.time}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-xs text-destructive">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <div className="flex justify-end pt-6">
                  {/* FIX: Subscribe only to the specific value we need */}
                  <form.Subscribe selector={(state) => state.values.schedulePublicId}>
                    {(scheduleId) => (
                      // FIX: type="button" prevents accidental form submission
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
                              // FIX: Stable unique key, not array index
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
                          // FIX: Use the stable `_id` instead of array index `i`
                          <div
                            key={symptom._id}
                            className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                          >
                            <div className="grid flex-1 gap-3 sm:grid-cols-3">
                              <form.Field name={`symptoms[${i}].name`}>
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
                                    />
                                  </div>
                                )}
                              </form.Field>
                              <form.Field name={`symptoms[${i}].severity`}>
                                {(subField) => (
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`symptom-severity-${symptom._id}`}
                                      className="text-xs"
                                    >
                                      Severity
                                    </Label>
                                    {/* FIX: No `as any` — cast to Severity which matches the schema enum */}
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
                                  </div>
                                )}
                              </form.Field>
                              <form.Field name={`symptoms[${i}].duration`}>
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
                                    />
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

                {/* FIX: Surface API errors to the user */}
                {bookingError && (
                  <p className="text-sm text-destructive" role="alert">
                    {bookingError}
                  </p>
                )}

                <div className="flex justify-between pt-6 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    <ChevronLeft className="mr-2 size-4" /> Back
                  </Button>

                  {/* FIX: Subscribe only to `canSubmit` and `isSubmitting`, not entire state */}
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
