import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BookingFormInstance } from "../../schema";
import { bookingSchema } from "../../schema";

type VisitReasonFieldProps = {
  form: BookingFormInstance;
};

export function VisitReasonField({ form }: VisitReasonFieldProps) {
  return (
    <form.Field name="visitReason" validators={{ onChange: bookingSchema.shape.visitReason }}>
      {(field) => (
        <Field data-invalid={field.state.meta.errors.length > 0}>
          <FieldLabel htmlFor={field.name}>
            Reason for Visit
            <span className="text-destructive" aria-hidden>
              *
            </span>
          </FieldLabel>
          <Textarea
            id={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="E.g., Experiencing severe headaches for the past 3 days."
            aria-required
          />
          <FieldError>{field.state.meta.errors[0]?.message}</FieldError>
        </Field>
      )}
    </form.Field>
  );
}
