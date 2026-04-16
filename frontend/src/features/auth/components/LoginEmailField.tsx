import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const getErrorMessage = (e: unknown): string => {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return String(e);
};

export function LoginEmailField({
  field,
}: {
  field: {
    name: string;
    state: {
      value: string;
      meta: { errors: unknown[] };
    };
    handleBlur: () => void;
    handleChange: (value: string) => void;
  };
}) {
  const errors = field.state.meta.errors;
  const errorMessage =
    errors.length > 0 ? errors.map(getErrorMessage).filter(Boolean).join(", ") : "";

  return (
    <Field data-invalid={field.state.meta.errors.length > 0}>
      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
      <Input
        aria-invalid={errors.length > 0}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="doctor@telehealth.com"
        type="email"
        value={field.state.value}
      />
      <FieldError>
        {errorMessage && <p className="text-destructive text-xs">{errorMessage}</p>}
      </FieldError>
    </Field>
  );
}
