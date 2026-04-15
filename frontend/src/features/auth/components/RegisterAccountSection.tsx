// import type { useForm } from "@tanstack/react-form";

import type { useForm } from "@tanstack/react-form";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { useRegisterForm } from "../hooks/useRegisterForm";
import type { RegisterFormData } from "../schemas/registerSchema";
import { PasswordInput } from "./PasswordInput";

type FormType = ReturnType<typeof useRegisterForm>["form"];

type RegisterAccountSectionProps = {
  form: FormType;
};

export function RegisterAccountSection({ form }: RegisterAccountSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Account Details</h3>

      {/* Username */}
      <form.Field name="username">
        {(field: {
          name: string;
          state: { value: string; meta: { errors: unknown[] } };
          handleBlur: () => void;
          handleChange: (v: string) => void;
        }) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Username</FieldLabel>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="johndoe123"
              value={field.state.value}
            />
            <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
          </Field>
        )}
      </form.Field>

      {/* Email */}
      <form.Field name="email">
        {(field: {
          name: string;
          state: { value: string; meta: { errors: unknown[] } };
          handleBlur: () => void;
          handleChange: (v: string) => void;
        }) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="jane@example.com"
              type="email"
              value={field.state.value}
            />
            <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
          </Field>
        )}
      </form.Field>

      {/* Password */}
      <form.Field name="password">
        {(field: {
          name: string;
          state: { value: string; meta: { errors: unknown[] } };
          handleBlur: () => void;
          handleChange: (v: string) => void;
        }) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Password</FieldLabel>
            <PasswordInput
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => field.handleChange(value)}
              placeholder="Min. 8 characters"
              value={field.state.value}
              error={undefined}
            />
            <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
          </Field>
        )}
      </form.Field>

      {/* Confirm Password */}
      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ["password"],
          onChange: ({
            value,
            fieldApi,
          }: {
            value: string;
            fieldApi: { form: { getFieldValue: (name: string) => string } };
          }) => {
            const password = fieldApi.form.getFieldValue("password");
            if (!value) {
              return "Please confirm your password.";
            }
            if (value !== password) {
              return "Passwords do not match.";
            }
            return undefined;
          },
        }}
      >
        {(field: {
          name: string;
          state: { value: string; meta: { errors: unknown[] } };
          handleBlur: () => void;
          handleChange: (v: string) => void;
        }) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
            <PasswordInput
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(value) => field.handleChange(value)}
              placeholder="Re-enter your password"
              value={field.state.value}
              error={undefined}
            />
            <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
          </Field>
        )}
      </form.Field>
    </div>
  );
}
