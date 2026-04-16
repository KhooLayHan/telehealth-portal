import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { PasswordInput } from "./PasswordInput";

const getErrorMessage = (e: unknown): string => {
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) return String(e.message);
  return String(e);
};

export function LoginPasswordField({
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
    <Field>
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
        <Button
          className="cursor-pointer text-muted-foreground text-xs hover:text-primary h-auto p-0"
          type="button"
          variant="link"
        >
          Forgot password?
        </Button>
      </div>
      <PasswordInput
        aria-invalid={errors.length > 0}
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(value) => field.handleChange(value)}
        placeholder="••••••••"
        value={field.state.value}
        error={errorMessage}
      />
    </Field>
  );
}
