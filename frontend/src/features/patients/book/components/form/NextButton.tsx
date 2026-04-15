import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingFormInstance, BookingFormValues } from "../../schema";

type NextButtonProps = {
  form: BookingFormInstance;
  onNext: () => void;
};

export function NextButton({ form, onNext }: NextButtonProps) {
  return (
    <form.Subscribe
      selector={(state: { values: BookingFormValues }) => state.values.schedulePublicId}
    >
      {(scheduleId: string) => (
        <Button type="button" onClick={onNext} disabled={!scheduleId}>
          Next Step <ChevronRight className="ml-2 size-4" />
        </Button>
      )}
    </form.Subscribe>
  );
}
