import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/auth/components/FormError";
import type { useCancelForm } from "../hooks/useCancelForm";

type CancelAppointmentFormProps = {
  form: CancelFormType;
  error: string | null;
  isPending: boolean;
  onClose: () => void;
};

export function CancelAppointmentForm({
  form,
  error,
  isPending,
  onClose,
}: CancelAppointmentFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4 pt-4"
    >
      {error && <FormError message={error} />}

      <form.Field name="cancellationReason">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Reason for Cancellation</FieldLabel>
            <Textarea
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="e.g., I have a sudden schedule conflict."
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
        <form.Subscribe>
          {(state: { canSubmit: boolean; isSubmitting: boolean }) => (
            <Button type="submit" variant="destructive" disabled={!state.canSubmit || isPending}>
              {isPending ? "Cancelling..." : "Confirm Cancellation"}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  );
}

export type CancelFormType = ReturnType<typeof useCancelForm>["form"];
