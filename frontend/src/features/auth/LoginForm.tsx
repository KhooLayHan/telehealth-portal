import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLoginUser } from "../../api/generated/authentication/authentication";
import { useAuthStore } from "../../store/useAuthStore";

// 1. Zod Schema
const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 2. Orval TanStack Query Mutation
  const loginMutation = useLoginUser();

  // 3. TanStack Form Setup
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Trigger the backend API call
      try {
        await loginMutation.mutateAsync(
          { data: value },
          {
            onSuccess: () => {
              // HttpOnly cookie is set! Update global Zustand state
              setAuth({
                publicId: "123",
                email: value.email,
                firstName: "User",
                role: "Patient",
              });

              // Redirect to the protected dashboard via TanStack Router
              navigate({ to: "/dashboard" });
            },
          }
        );
      } catch (_error) {
        // Error is handled by mutation state (loginMutation.isError)
        // UI already shows error alert via loginMutation.isError check
      }
    },
  });

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center font-bold text-2xl">
            TeleHealth Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Form wrapper */}
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            {/* Email Field */}
            <form.Field
              name="email"
              validators={{ onChange: loginSchema.shape.email }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-destructive" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="doctor@telehealth.com"
                    type="email"
                    value={field.state.value}
                  />
                  {/* Validation Error Message */}
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Password Field */}
            <form.Field
              name="password"
              validators={{ onChange: loginSchema.shape.password }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Password</Label>
                  <Input
                    className={
                      field.state.meta.errors.length ? "border-destructive" : ""
                    }
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="••••••••"
                    type="password"
                    value={field.state.value}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Global API Error Alert (Optional) */}
            {loginMutation.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-destructive-foreground text-sm">
                Invalid email or password. Please try again.
              </div>
            )}

            {/* Submit Button (Subscribed to form state for performance!) */}
            <form.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={
                    !state.canSubmit ||
                    state.isSubmitting ||
                    loginMutation.isPending
                  }
                  type="submit"
                >
                  {loginMutation.isPending ? "Authenticating..." : "Login"}
                </Button>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
