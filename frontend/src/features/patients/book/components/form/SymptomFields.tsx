import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        <div className="space-y-1">
          <Label htmlFor={`symptom-name-${symptomId}`} className="text-xs">
            Symptom
          </Label>
          <Input
            id={`symptom-name-${symptomId}`}
            value={subField.state.value}
            onBlur={subField.handleBlur}
            onChange={(e) => subField.handleChange(e.target.value)}
            placeholder="Fever"
            aria-invalid={subField.state.meta.errors.length > 0}
          />
          {subField.state.meta.errors.length > 0 && (
            <p className="text-xs text-destructive">{subField.state.meta.errors[0]?.message}</p>
          )}
        </div>
      )}
    </form.Field>
  );
}

interface SymptomSeverityFieldProps {
  form: BookingFormInstance;
  index: number;
  symptomId: string;
}

export function SymptomSeverityField({ form, index, symptomId }: SymptomSeverityFieldProps) {
  return (
    <form.Field
      name={`symptoms[${index}].severity`}
      validators={{ onChange: symptomItemSchema.shape.severity }}
    >
      {(subField) => (
        <div className="space-y-1">
          <Label htmlFor={`symptom-severity-${symptomId}`} className="text-xs">
            Severity
          </Label>
          <select
            id={`symptom-severity-${symptomId}`}
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
            <p className="text-xs text-destructive">{subField.state.meta.errors[0]?.message}</p>
          )}
        </div>
      )}
    </form.Field>
  );
}

interface SymptomDurationFieldProps {
  form: BookingFormInstance;
  index: number;
  symptomId: string;
}

export function SymptomDurationField({ form, index, symptomId }: SymptomDurationFieldProps) {
  return (
    <form.Field
      name={`symptoms[${index}].duration`}
      validators={{ onChange: symptomItemSchema.shape.duration }}
    >
      {(subField) => (
        <div className="space-y-1">
          <Label htmlFor={`symptom-duration-${symptomId}`} className="text-xs">
            Duration
          </Label>
          <Input
            id={`symptom-duration-${symptomId}`}
            value={subField.state.value}
            onBlur={subField.handleBlur}
            onChange={(e) => subField.handleChange(e.target.value)}
            placeholder="2 days"
            aria-invalid={subField.state.meta.errors.length > 0}
          />
          {subField.state.meta.errors.length > 0 && (
            <p className="text-xs text-destructive">{subField.state.meta.errors[0]?.message}</p>
          )}
        </div>
      )}
    </form.Field>
  );
}
