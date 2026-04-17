import type { ReactNode } from "react";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";

type FormFieldProps = {
  label: ReactNode;
  error?: string;
  children: ReactNode;
};
export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <Field orientation="vertical" className="w-full">
      <FieldLabel>{label}</FieldLabel>
      <FieldContent>{children}</FieldContent>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
