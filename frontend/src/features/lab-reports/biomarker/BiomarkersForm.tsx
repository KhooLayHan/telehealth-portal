import { ChevronLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BiomarkerRow } from "./components/BiomarkerRow";
import { BiomarkersHeader } from "./components/BiomarkersHeader";
import { useBiomarkersForm } from "./hooks/useBiomarkersForm";
import type { Biomarker, BiomarkersFormProps } from "./schema";

export type { BiomarkersFormProps, BiomarkersFormValues } from "./schema";

export function BiomarkersForm({ labReportId, onBack, onSuccess }: BiomarkersFormProps) {
  const { form, completeMutation, submitError, biomarkerSchema, createEmptyBiomarkerRow } =
    useBiomarkersForm({ labReportId, onBack, onSuccess });

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
      <form.Field name="biomarkers">
        {(field) => (
          <>
            <BiomarkersHeader onAdd={() => field.pushValue(createEmptyBiomarkerRow())} />

            <div className="space-y-3">
              {field.state.value.length === 0 && (
                <p className="text-sm text-muted-foreground italic p-4 text-center border rounded-md border-dashed">
                  No metrics added yet.
                </p>
              )}

              {(field.state.value as Biomarker[]).map((row, i) => (
                <BiomarkerRow
                  key={row._id}
                  index={i}
                  form={form}
                  onRemove={() => field.removeValue(i)}
                  biomarkerSchema={biomarkerSchema}
                />
              ))}
            </div>
          </>
        )}
      </form.Field>

      {submitError && (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      )}

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
                  <Send className="mr-2 size-4" aria-hidden="true" /> Publish & Notify Patient
                </>
              )}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}
