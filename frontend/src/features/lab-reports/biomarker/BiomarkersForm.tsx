import { useForm } from "@tanstack/react-form";
import { ChevronLeft, Plus, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useUpdateBySlug } from "@/api/generated/lab-reports/lab-reports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// FIX #4: flag values lowercased to match the database/API contract
const biomarkerSchema = z.object({
  name: z.string().min(1, "Name required"),
  value: z.string().min(1, "Value required"),
  unit: z.string().min(1, "Unit required"),
  referenceRange: z.string().min(1, "Range required"),
  flag: z.enum(["normal", "high", "low"]),
});

const reportSchema = z.object({
  biomarkers: z.array(biomarkerSchema).default([]),
});

export type BiomarkersFormValues = z.infer<typeof reportSchema>;

// FIX #1: stable row identity so removing from the middle doesn't scramble fields
type BiomarkerRow = z.infer<typeof biomarkerSchema> & { _id: string };

type FlagValue = "normal" | "high" | "low";

type BiomarkersFormProps = {
  labReportId: string;
  onBack: () => void;
  onSuccess: () => void;
};

export const defaultValues: BiomarkersFormValues = { biomarkers: [] };

const EMPTY_ROW = (): BiomarkerRow => ({
  _id: crypto.randomUUID(),
  name: "",
  value: "",
  unit: "",
  referenceRange: "",
  flag: "normal",
});

export function BiomarkersForm({ labReportId, onBack, onSuccess }: BiomarkersFormProps) {
  const completeMutation = useUpdateBySlug();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await completeMutation.mutateAsync({
          slug: labReportId,
          data: { biomarkers: value.biomarkers },
        });

        onSuccess();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to complete lab report.";
        setSubmitError(message);
      }

      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6 pt-4"
      noValidate
    >
      {/* FIX #7: single <form.Field> subscription for both the button and the list */}
      <form.Field name="biomarkers">
        {(field) => (
          <>
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Test Results (Biomarkers)</Label>
                <p className="text-xs text-muted-foreground">
                  Extract the key metrics from the PDF for the doctor to review.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.pushValue(EMPTY_ROW())}
              >
                <Plus className="mr-1 size-3" aria-hidden="true" /> Add Metric
              </Button>
            </div>

            {/* Biomarker rows */}
            <div className="space-y-3">
              {field.state.value.length === 0 && (
                <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
                  No metrics added yet.
                </p>
              )}

              {/* FIX #1: key by stable _id, not array index */}
              {field.state.value.map((row, i) => (
                <div
                  key={row._id}
                  className="flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border"
                >
                  <div className="grid flex-1 gap-3 sm:grid-cols-5">
                    {/* Name */}
                    <form.Field
                      name={`biomarkers[${i}].name`}
                      validators={{ onChange: biomarkerSchema.shape.name }}
                    >
                      {(sub) => {
                        const id = `biomarkers-${i}-name`;
                        return (
                          <div className="space-y-1 sm:col-span-2">
                            {/* FIX #8: htmlFor/id pairing on every label */}
                            <Label htmlFor={id} className="text-xs">
                              Metric (e.g. Hemoglobin)
                            </Label>
                            <Input
                              id={id}
                              value={sub.state.value}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                              aria-invalid={sub.state.meta.errors.length > 0}
                              className={sub.state.meta.errors.length ? "border-destructive" : ""}
                            />

                            {sub.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive" role="alert">
                                {sub.state.meta.errors[0]?.message}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    </form.Field>

                    {/* Value */}
                    <form.Field
                      name={`biomarkers[${i}].value`}
                      validators={{ onChange: biomarkerSchema.shape.value }}
                    >
                      {(sub) => {
                        const id = `biomarkers-${i}-value`;
                        return (
                          <div className="space-y-1">
                            <Label htmlFor={id} className="text-xs">
                              Value
                            </Label>
                            <Input
                              id={id}
                              value={sub.state.value}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                              aria-invalid={sub.state.meta.errors.length > 0}
                              className={sub.state.meta.errors.length ? "border-destructive" : ""}
                            />
                            {sub.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive" role="alert">
                                {sub.state.meta.errors[0]?.message}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    </form.Field>

                    {/* Unit */}
                    <form.Field
                      name={`biomarkers[${i}].unit`}
                      validators={{ onChange: biomarkerSchema.shape.unit }}
                    >
                      {(sub) => {
                        const id = `biomarkers-${i}-unit`;
                        return (
                          <div className="space-y-1">
                            <Label htmlFor={id} className="text-xs">
                              Unit
                            </Label>
                            <Input
                              id={id}
                              value={sub.state.value}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                              placeholder="g/dL"
                              aria-invalid={sub.state.meta.errors.length > 0}
                              className={sub.state.meta.errors.length ? "border-destructive" : ""}
                            />
                            {sub.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive" role="alert">
                                {sub.state.meta.errors[0]?.message}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    </form.Field>

                    {/* FIX #2: referenceRange was in schema but missing from UI */}
                    <form.Field
                      name={`biomarkers[${i}].referenceRange`}
                      validators={{ onChange: biomarkerSchema.shape.referenceRange }}
                    >
                      {(sub) => {
                        const id = `biomarkers-${i}-referenceRange`;
                        return (
                          <div className="space-y-1">
                            <Label htmlFor={id} className="text-xs">
                              Reference Range
                            </Label>
                            <Input
                              id={id}
                              value={sub.state.value}
                              onChange={(e) => sub.handleChange(e.target.value)}
                              onBlur={sub.handleBlur}
                              placeholder="12.0-16.0"
                              aria-invalid={sub.state.meta.errors.length > 0}
                              className={sub.state.meta.errors.length ? "border-destructive" : ""}
                            />
                            {sub.state.meta.errors.length > 0 && (
                              <p className="text-xs text-destructive" role="alert">
                                {sub.state.meta.errors[0]?.message}
                              </p>
                            )}
                          </div>
                        );
                      }}
                    </form.Field>

                    {/* FIX #4: lowercased option values; FIX #3: typed cast instead of `as any` */}
                    <form.Field name={`biomarkers[${i}].flag`}>
                      {(sub) => {
                        const id = `biomarkers-${i}-flag`;
                        return (
                          <div className="space-y-1">
                            <Label htmlFor={id} className="text-xs">
                              Flag
                            </Label>
                            <select
                              id={id}
                              value={sub.state.value}
                              onChange={(e) => sub.handleChange(e.target.value as FlagValue)}
                              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                            >
                              <option value="normal">Normal</option>
                              <option value="high">High</option>
                              <option value="low">Low</option>
                            </select>
                          </div>
                        );
                      }}
                    </form.Field>
                  </div>

                  {/* FIX #10: accessible aria-label on remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove biomarker row ${i + 1}`}
                    className="text-destructive mt-5 shrink-0"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </form.Field>

      {/* FIX #5: surface submit-level errors in the UI */}
      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {(submitError) =>
          submitError ? (
            <p role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          ) : null
        }
      </form.Subscribe>

      <form.Subscribe selector={(s) => s.errorMap.onSubmit}>
        {submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}
      </form.Subscribe>
      <div className="flex justify-between pt-6 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 size-4" aria-hidden="true" /> Back
        </Button>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" disabled={!canSubmit || completeMutation.isPending}>
              {completeMutation.isPending ? (
                "Finalizing..."
              ) : (
                <>
                  <Send className="mr-2 size-4" aria-hidden="true" /> Publish &amp; Notify Patient
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
