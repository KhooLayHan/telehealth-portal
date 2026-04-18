import type { AnyFieldApi } from "@tanstack/react-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UseBiomarkersFormReturn } from "../hooks/useBiomarkersForm";
import type { FlagValue } from "../schema";
import { BiomarkerField } from "./BiomarkerField";

export type BiomarkerRowProps = {
  index: number;
  form: UseBiomarkersFormReturn["form"];
  onRemove: () => void;
  biomarkerSchema: UseBiomarkersFormReturn["biomarkerSchema"];
};

export function BiomarkerRow({ index, form, onRemove, biomarkerSchema }: BiomarkerRowProps) {
  return (
    <div className="flex items-start gap-2 bg-muted/20 p-3 rounded-lg border border-border">
      <div className="grid flex-1 gap-3 sm:grid-cols-5">
        <form.Field
          name={`biomarkers[${index}].name`}
          validators={{ onChange: biomarkerSchema.shape.name }}
        >
          {(sub: AnyFieldApi) => {
            const id = `biomarkers-${index}-name`;
            return (
              <BiomarkerField
                label="Metric (e.g. Hemoglobin)"
                htmlFor={id}
                error={sub.state.meta.errors[0]?.message}
              >
                <Input
                  id={id}
                  value={sub.state.value}
                  onChange={(e) => sub.handleChange(e.target.value)}
                  onBlur={sub.handleBlur}
                  aria-invalid={sub.state.meta.errors.length > 0}
                />
              </BiomarkerField>
            );
          }}
        </form.Field>

        <form.Field
          name={`biomarkers[${index}].value`}
          validators={{ onChange: biomarkerSchema.shape.value }}
        >
          {(sub: AnyFieldApi) => {
            const id = `biomarkers-${index}-value`;
            return (
              <BiomarkerField label="Value" htmlFor={id} error={sub.state.meta.errors[0]?.message}>
                <Input
                  id={id}
                  value={sub.state.value}
                  onChange={(e) => sub.handleChange(e.target.value)}
                  onBlur={sub.handleBlur}
                  aria-invalid={sub.state.meta.errors.length > 0}
                />
              </BiomarkerField>
            );
          }}
        </form.Field>

        <form.Field
          name={`biomarkers[${index}].unit`}
          validators={{ onChange: biomarkerSchema.shape.unit }}
        >
          {(sub: AnyFieldApi) => {
            const id = `biomarkers-${index}-unit`;
            return (
              <BiomarkerField label="Unit" htmlFor={id} error={sub.state.meta.errors[0]?.message}>
                <Input
                  id={id}
                  value={sub.state.value}
                  onChange={(e) => sub.handleChange(e.target.value)}
                  onBlur={sub.handleBlur}
                  placeholder="g/dL"
                  aria-invalid={sub.state.meta.errors.length > 0}
                />
              </BiomarkerField>
            );
          }}
        </form.Field>

        <form.Field
          name={`biomarkers[${index}].referenceRange`}
          validators={{ onChange: biomarkerSchema.shape.referenceRange }}
        >
          {(sub: AnyFieldApi) => {
            const id = `biomarkers-${index}-referenceRange`;
            return (
              <BiomarkerField
                label="Reference Range"
                htmlFor={id}
                error={sub.state.meta.errors[0]?.message}
              >
                <Input
                  id={id}
                  value={sub.state.value}
                  onChange={(e) => sub.handleChange(e.target.value)}
                  onBlur={sub.handleBlur}
                  placeholder="12.0-16.0"
                  aria-invalid={sub.state.meta.errors.length > 0}
                />
              </BiomarkerField>
            );
          }}
        </form.Field>

        <form.Field name={`biomarkers[${index}].flag`}>
          {(sub: AnyFieldApi) => {
            const id = `biomarkers-${index}-flag`;
            return (
              <BiomarkerField label="Flag" htmlFor={id}>
                <Select
                  value={sub.state.value}
                  onValueChange={(value) => sub.handleChange(value as FlagValue)}
                >
                  <SelectTrigger id={id}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </BiomarkerField>
            );
          }}
        </form.Field>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove biomarker row ${index + 1}`}
        className="text-destructive mt-5 shrink-0"
        onClick={onRemove}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
