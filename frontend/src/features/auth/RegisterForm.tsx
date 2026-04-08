import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Heart } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { useRegisterPatient } from "@/api/generated/authentication/authentication";
import type { ApiError } from "src/api/ofetch-mutator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  role: z.string().min(1, "Please select a role"),
  dateOfBirth: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // TanStack Query Mutation
  const registerMutation = useRegisterPatient();

  const form = useForm({
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      dateOfBirth: "",
      password: "",
      icNumber: "",
      gender: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value }) => {
      setGlobalError(null);

      try {
        // Strip out confirmPassword as backend doesn't need it
        const { confirmPassword, ...commandData } = value;

        await registerMutation.mutateAsync({ data: commandData });

        navigate({ to: "/login" });
      } catch (err) {
        const apiError = err as ApiError;

        setGlobalError(
          apiError.data?.detail ??
            apiError.data?.title ??
            "Registration failed."
        );
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Mobile-only branding */}
      <div className="flex items-center justify-center gap-2 lg:hidden">
        <Heart className="size-6 text-primary" />
        <span className="font-bold text-xl">TeleHealth</span>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Join TeleHealth to access quality healthcare
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            {/* Global Error Alert */}
            <div
              aria-live="assertive"
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-destructive-foreground text-sm"
            >
              {globalError}
            </div>

            {/* First name + Last name */}
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="firstName"
                validators={{ onChange: registerSchema.shape.firstName }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>First name</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Jane"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="lastName"
                validators={{ onChange: registerSchema.shape.lastName }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Last name</Label>
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Doe"
                      value={field.state.value}
                    />
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Email */}
            <form.Field
              name="email"
              validators={{ onChange: registerSchema.shape.email }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Email</Label>
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
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Role + Date of Birth */}
            <div className="grid grid-cols-2 gap-3">
              <form.Field
                name="role"
                validators={{ onChange: registerSchema.shape.role }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Role</Label>
                    <select
                      aria-invalid={field.state.meta.errors.length > 0}
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      value={field.state.value}
                    >
                      <option disabled value="">
                        Select role
                      </option>
                      <option value="Patient">Patient</option>
                      <option value="Doctor">Doctor</option>
                    </select>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              <form.Field name="dateOfBirth">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>
                      Date of birth{" "}
                      <span className="font-normal text-muted-foreground">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="date"
                      value={field.state.value}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            {/* Password */}
            <form.Field
              name="password"
              validators={{ onChange: registerSchema.shape.password }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Password</Label>
                  <div className="relative">
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      className="pr-9"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Min. 8 characters"
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Confirm Password */}
            <form.Field
              name="confirmPassword"
              validators={{ onChange: registerSchema.shape.confirmPassword }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Confirm password</Label>
                  <div className="relative">
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      className="pr-9"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Re-enter your password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={field.state.value}
                    />
                    <button
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      type="button"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Terms & Conditions */}
            <div className="flex items-start gap-2">
              <input
                checked={acceptTerms}
                className="mt-0.5 size-4 rounded border-input accent-primary"
                id="accept-terms"
                onChange={(e) => setAcceptTerms(e.target.checked)}
                type="checkbox"
              />
              <label
                className="cursor-pointer select-none text-muted-foreground text-sm leading-snug"
                htmlFor="accept-terms"
              >
                I agree to the{" "}
                <button className="text-primary hover:underline" type="button">
                  Terms of Service
                </button>{" "}
                and{" "}
                <button className="text-primary hover:underline" type="button">
                  Privacy Policy
                </button>
              </label>
            </div>

            {/* Submit */}
            <form.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={
                    !state.canSubmit || state.isSubmitting || !acceptTerms
                  }
                  size="lg"
                  type="submit"
                >
                  {state.isSubmitting
                    ? "Creating account..."
                    : "Create account"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          {/* Sign in link */}
          <p className="mt-6 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
