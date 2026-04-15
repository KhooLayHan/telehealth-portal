import { Button } from "@/components/ui/button";
import type { BookingFormInstance } from "../../schema";

type SubmitButtonProps = {
  form: BookingFormInstance;
  isPending: boolean;
};

export function SubmitButton({ form, isPending }: SubmitButtonProps) {
  return (
    <form.Subscribe
      selector={(state: { canSubmit: boolean; isSubmitting: boolean }) =>
        [state.canSubmit, state.isSubmitting] as const
      }
    >
      {(value) => {
        const [canSubmit, isSubmitting] = value as readonly [boolean, boolean];
        return (
          <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
            {isSubmitting || isPending ? "Confirming…" : "Confirm Booking"}
          </Button>
        );
      }}
    </form.Subscribe>
  );
}
