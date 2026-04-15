import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { RegisterFormType } from "../hooks/useRegisterForm";

type RegisterPersonalInfoSectionProps = {
  form: RegisterFormType;
};

export function RegisterPersonalInfoSection({ form }: RegisterPersonalInfoSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>

      {/* First Name + Last Name */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="firstName">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>First name</FieldLabel>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Jane"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="lastName">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Doe"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>

      {/* IC Number */}
      <form.Field name="icNumber">
        {(field) => (
          <Field data-invalid={field.state.meta.errors.length > 0}>
            <FieldLabel htmlFor={field.name}>IC Number</FieldLabel>
            <Input
              aria-invalid={field.state.meta.errors.length > 0}
              id={field.name}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="012345678901"
              value={field.state.value}
            />
            <FieldError errors={field.state.meta.errors} />
          </Field>
        )}
      </form.Field>

      {/* Date of Birth + Gender */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="dateOfBirth">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Date of birth</FieldLabel>
              <Input
                aria-invalid={field.state.meta.errors.length > 0}
                id={field.name}
                name={field.name}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                type="date"
                value={field.state.value}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <form.Field name="gender">
          {(field) => (
            <Field data-invalid={field.state.meta.errors.length > 0}>
              <FieldLabel htmlFor={field.name}>Gender</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value as "M" | "F" | "O" | "N")}
              >
                <SelectTrigger aria-invalid={field.state.meta.errors.length > 0} id={field.name}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="O">Other</SelectItem>
                  <SelectItem value="N">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>
      </div>
    </div>
  );
}
