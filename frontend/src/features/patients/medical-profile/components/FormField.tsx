import type { ReactNode } from "react";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";

type FormFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
};
export function FormField({ label, htmlFor, error, children }: FormFieldProps) {
  return (
    <Field orientation="vertical" className="w-full">
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      <FieldContent>{children}</FieldContent>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
