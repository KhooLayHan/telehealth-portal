import { ChevronLeft, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BookingFormInstance, Severity } from "./schema";
import { bookingSchema, SEVERITY_OPTIONS, symptomItemSchema } from "./schema";

interface MedicalDetailsStepProps {
  form: BookingFormInstance;
  onBack: () => void;
  bookingError: string | null;
  isPending: boolean;
}

// Formats a NodaTime LocalTime string ("HH:mm:ss") to display form ("HH:mm").
export const formatLocalTime = (t: string): string => t.slice(0, 5);

export function MedicalDetailsForm({
  form,
  onBack,
  bookingError,
  isPending,
}: MedicalDetailsStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Medical Details</CardTitle>
        <CardDescription>
          Please describe your reason for visiting to help the doctor prepare.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Visit reason */}
        <form.Field name="visitReason" validators={{ onChange: bookingSchema.shape.visitReason }}>
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
                <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
              )}
            </div>
          )}
        </form.Field>

        {/* Symptoms — dynamic array with per-field validation */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <Label>Symptoms (Optional)</Label>
              <p className="text-xs text-muted-foreground">
                Add specific symptoms you are experiencing.
              </p>
            </div>

            {/* "Add Symptom" button lives in its own Field so pushValue is
                available without subscribing to the whole array. */}
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

          {/* Symptom rows */}
          <form.Field name="symptoms">
            {(field) => (
              <div className="space-y-3">
                {field.state.value.map((symptom, i) => (
                  <div
                    key={symptom._id}
                    className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                  >
                    <div className="grid flex-1 gap-3 sm:grid-cols-3">
                      {/* Each sub-field validates against symptomItemSchema.shape
                          so errors surface inline before the form can submit,
                          matching what BookAppointmentValidator enforces server-side. */}
                      <form.Field
                        name={`symptoms[${i}].name`}
                        validators={{ onChange: symptomItemSchema.shape.name }}
                      >
                        {(subField) => (
                          <div className="space-y-1">
                            <Label htmlFor={`symptom-name-${symptom._id}`} className="text-xs">
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

                      <form.Field
                        name={`symptoms[${i}].severity`}
                        validators={{ onChange: symptomItemSchema.shape.severity }}
                      >
                        {(subField) => (
                          <div className="space-y-1">
                            <Label htmlFor={`symptom-severity-${symptom._id}`} className="text-xs">
                              Severity
                            </Label>
                            <select
                              id={`symptom-severity-${symptom._id}`}
                              value={subField.state.value}
                              onBlur={subField.handleBlur}
                              onChange={(e) => subField.handleChange(e.target.value as Severity)}
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
                        validators={{ onChange: symptomItemSchema.shape.duration }}
                      >
                        {(subField) => (
                          <div className="space-y-1">
                            <Label htmlFor={`symptom-duration-${symptom._id}`} className="text-xs">
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

        {/* API-level booking error */}
        {bookingError && (
          <p className="text-sm text-destructive" role="alert">
            {bookingError}
          </p>
        )}

        <div className="flex justify-between pt-6 border-t border-border">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ChevronLeft className="mr-2 size-4" /> Back
          </Button>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isPending}>
                {isSubmitting || isPending ? "Confirming…" : "Confirm Booking"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </CardContent>
    </>
  );
}
