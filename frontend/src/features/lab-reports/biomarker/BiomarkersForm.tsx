import { useForm } from "@tanstack/react-form";
import { ChevronLeft, Plus, Send, Trash2 } from "lucide-react";
import { z } from "zod";

import { useUpdateBySlug } from "@/api/generated/lab-reports/lab-reports";
import type { ApiError } from "@/api/ofetch-mutator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Match the Biomarker C# record
const biomarkerSchema = z.object({
  name: z.string().min(1, "Name required"),
  value: z.string().min(1, "Value required"),
  unit: z.string().min(1, "Unit required"),
  referenceRange: z.string().min(1, "Range required"),
  flag: z.enum(["Normal", "High", "Low"]),
});

const reportSchema = z.object({
  biomarkers: z.array(biomarkerSchema).default([]),
});

type BiomarkersFormProps = {
  labReportId: string; // The ID we got from Step 1!
  onBack: () => void;
  onSuccess: () => void;
};

export function BiomarkersForm({ labReportId, onBack, onSuccess }: BiomarkersFormProps) {
  const completeMutation = useUpdateBySlug();

  const form = useForm({
    defaultValues: { biomarkers: [] },
    onSubmit: async ({ value }) => {
      try {
        // Complete the report, save JSONB, and trigger AWS SNS Email!
        // Note: The ASP.NET API uses 'slug', so we pass our publicId here
        await completeMutation.mutateAsync({
          slug: labReportId,
          data: { biomarkers: value.biomarkers as any },
        });
        onSuccess();
      } catch (err) {
        const apiError = err as ApiError;
        console.error("Failed to complete lab report:", apiError.data?.title);
      }
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
    >
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base">Test Results (Biomarkers)</Label>
          <p className="text-xs text-muted-foreground">
            Extract the key metrics from the PDF for the doctor to review.
          </p>
        </div>
        <form.Field name="biomarkers">
          {(field) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                field.pushValue({
                  name: "",
                  value: "",
                  unit: "",
                  referenceRange: "",
                  flag: "Normal",
                })
              }
            >
              <Plus className="mr-1 size-3" /> Add Metric
            </Button>
          )}
        </form.Field>
      </div>

      <form.Field name="biomarkers">
        {(field) => (
          <div className="space-y-3">
            {field.state.value.length === 0 && (
              <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
                No metrics added yet.
              </p>
            )}

            {field.state.value.map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border"
              >
                <div className="grid flex-1 gap-3 sm:grid-cols-5">
                  <form.Field
                    name={`biomarkers[${i}].name`}
                    validators={{ onChange: biomarkerSchema.shape.name }}
                  >
                    {(sub) => (
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Metric (e.g. Hemoglobin)</Label>
                        <Input
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          onBlur={sub.handleBlur}
                          className={sub.state.meta.errors.length ? "border-destructive" : ""}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field
                    name={`biomarkers[${i}].value`}
                    validators={{ onChange: biomarkerSchema.shape.value }}
                  >
                    {(sub) => (
                      <div className="space-y-1">
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          onBlur={sub.handleBlur}
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name={`biomarkers[${i}].unit`}>
                    {(sub) => (
                      <div className="space-y-1">
                        <Label className="text-xs">Unit</Label>
                        <Input
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value)}
                          placeholder="g/dL"
                        />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name={`biomarkers[${i}].flag`}>
                    {(sub) => (
                      <div className="space-y-1">
                        <Label className="text-xs">Flag</Label>
                        <select
                          value={sub.state.value}
                          onChange={(e) => sub.handleChange(e.target.value as any)}
                          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    )}
                  </form.Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive mt-5"
                  onClick={() => field.removeValue(i)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </form.Field>

      <div className="flex justify-between pt-6 border-t border-border">
        <Button type="button" variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 size-4" /> Back
        </Button>
        <form.Subscribe>
          {(state) => (
            <Button type="submit" disabled={!state.canSubmit || completeMutation.isPending}>
              {completeMutation.isPending ? (
                "Finalizing..."
              ) : (
                <>
                  <Send className="mr-2 size-4" /> Publish & Notify Patient
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
