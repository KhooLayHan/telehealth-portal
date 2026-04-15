import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BookingFormInstance, Severity } from "../../schema";
import { SEVERITY_OPTIONS, symptomItemSchema } from "../../schema";

type SymptomNameFieldProps = {
  form: BookingFormInstance;
  index: number;
  symptomId: string;
};

export function SymptomNameField({ form, index, symptomId }: SymptomNameFieldProps) {
  return (
    <form.Field
      name={`symptoms[${index}].name`}
      validators={{ onChange: symptomItemSchema.shape.name }}
    >
      {(subField) => (
        <Field data-invalid={subField.state.meta.errors.length > 0}>
          <FieldLabel htmlFor={`symptom-name-${symptomId}`} className="text-xs">
            Symptom
          </FieldLabel>
          <Input
            id={`symptom-name-${symptomId}`}
            value={subField.state.value}
            onBlur={subField.handleBlur}
            onChange={(e) => subField.handleChange(e.target.value)}
            placeholder="Fever"
            aria-invalid={subField.state.meta.errors.length > 0}
          />
          <FieldError>{subField.state.meta.errors[0]?.message}</FieldError>
        </Field>
      )}
    </form.Field>
  );
}

type SymptomSeverityFieldProps = {
  form: BookingFormInstance;
  index: number;
  symptomId: string;
};

export function SymptomSeverityField({ form, index, symptomId }: SymptomSeverityFieldProps) {
  return (
    <form.Field
      name={`symptoms[${index}].severity`}
      validators={{ onChange: symptomItemSchema.shape.severity }}
    >
      {(subField) => (
        <Field data-invalid={subField.state.meta.errors.length > 0}>
          <FieldLabel htmlFor={`symptom-severity-${symptomId}`} className="text-xs">
            Severity
          </FieldLabel>
          <Select
            value={subField.state.value}
            onValueChange={(value) => subField.handleChange(value as Severity)}
          >
            <SelectTrigger
              id={`symptom-severity-${symptomId}`}
              className="h-9 w-full"
              aria-invalid={subField.state.meta.errors.length > 0}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SEVERITY_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{subField.state.meta.errors[0]?.message}</FieldError>
        </Field>
      )}
    </form.Field>
  );
}

type SymptomDurationFieldProps = {
  form: BookingFormInstance;
  index: number;
  symptomId: string;
};

export function SymptomDurationField({ form, index, symptomId }: SymptomDurationFieldProps) {
  return (
    <form.Field
      name={`symptoms[${index}].duration`}
      validators={{ onChange: symptomItemSchema.shape.duration }}
    >
      {(subField) => (
        <Field data-invalid={subField.state.meta.errors.length > 0}>
          <FieldLabel htmlFor={`symptom-duration-${symptomId}`} className="text-xs">
            Duration
          </FieldLabel>
          <Input
            id={`symptom-duration-${symptomId}`}
            value={subField.state.value}
            onBlur={subField.handleBlur}
            onChange={(e) => subField.handleChange(e.target.value)}
            placeholder="2 days"
            aria-invalid={subField.state.meta.errors.length > 0}
          />
          <FieldError>{subField.state.meta.errors[0]?.message}</FieldError>
        </Field>
      )}
    </form.Field>
  );
}
