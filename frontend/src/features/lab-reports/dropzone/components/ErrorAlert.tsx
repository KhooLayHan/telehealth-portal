import { FieldError } from "@/components/ui/field";

type ErrorAlertProps = {
  message: string;
};

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <FieldError
      role="alert"
      className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
    >
      {message}
    </FieldError>
  );
}
