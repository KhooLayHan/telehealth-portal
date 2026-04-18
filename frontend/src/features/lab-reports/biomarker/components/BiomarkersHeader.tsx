import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";

export type BiomarkersHeaderProps = {
  onAdd: () => void;
};

export function BiomarkersHeader({ onAdd }: BiomarkersHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Field orientation="vertical">
        <FieldLabel className="text-base">Test Results (Biomarkers)</FieldLabel>
        <p className="text-xs text-muted-foreground">
          Extract the key metrics from the PDF for the doctor to review.
        </p>
      </Field>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="mr-1 size-3" aria-hidden="true" /> Add Metric
      </Button>
    </div>
  );
}
