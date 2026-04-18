import type { ReactNode } from "react";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";

export type BiomarkerFieldProps = {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
};

export function BiomarkerField({ label, htmlFor, error, children }: BiomarkerFieldProps) {
  return (
    <Field orientation="vertical" className="space-y-1">
      <FieldLabel htmlFor={htmlFor} className="text-xs">
        {label}
      </FieldLabel>
      <FieldContent>{children}</FieldContent>
      {error && <FieldError className="text-xs">{error}</FieldError>}
    </Field>
  );
}
