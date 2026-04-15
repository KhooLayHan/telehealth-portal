import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <Button type="button" variant="ghost" onClick={onClick}>
      <ChevronLeft className="mr-2 size-4" /> Back
    </Button>
  );
}

interface SubmitButtonProps {
  disabled: boolean;
  isSubmitting: boolean;
}

export function SubmitButton({ disabled, isSubmitting }: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={disabled}>
      {isSubmitting ? "Confirming…" : "Confirm Booking"}
    </Button>
  );
}
