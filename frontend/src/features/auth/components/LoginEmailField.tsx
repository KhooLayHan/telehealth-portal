import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

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
    errors.length > 0
      ? errors
          .map((e) => (typeof e === "string" ? e : String(e)))
          .filter(Boolean)
          .join(", ")
      : "";

  return (
    <Field>
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
      {errorMessage && <p className="text-destructive text-xs">{errorMessage}</p>}
    </Field>
  );
}
