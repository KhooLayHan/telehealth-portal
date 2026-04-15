import { Label } from "@/components/ui/label";
import type { BookingFormInstance } from "../../schema";
import { bookingSchema } from "../../schema";

interface VisitReasonFieldProps {
  form: BookingFormInstance;
}

export function VisitReasonField({ form }: VisitReasonFieldProps) {
  return (
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
  );
}
