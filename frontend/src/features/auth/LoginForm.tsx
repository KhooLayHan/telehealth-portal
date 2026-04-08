import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Heart } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

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
import { useAuthStore } from "@/store/useAuthStore";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: ({ value }) => {
      console.log("Login submitted", { ...value, rememberMe });
        setGlobalError(null);

        try {
            await loginMutation.mutateAsync({ data: value });

            // TODO: Ideally, you'd call a useGetMyProfile() hook here to get real user data)
            setAuth({
                publicId: "authenticated-user",
                email: value.email,
                firstName: "Welcome",
                role: "Patient", // Or read from profile endpoint later
            });

            // 3. Redirect to Dashboard
            navigate({ to: "/dashboard" });
        } catch (err) {
            const apiError = err as ApiError;
            
            if (apiError.status === 401) {
                setGlobalError("Invalid email or password.");
            } else {
                setGlobalError(apiError.data?.title || "An unexpected error occurred.");
            }
        }
    },
  });

  return (
    <div className="space-y-6">
      {/* Mobile-only branding (hidden on large screens where the left panel shows) */}
      <div className="flex items-center justify-center gap-2 lg:hidden">
        <Heart className="size-6 text-primary" />
        <span className="font-bold text-xl">TeleHealth</span>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your TeleHealth account</CardDescription>
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
            {/* Email */}
            <form.Field
              name="email"
              validators={{ onChange: loginSchema.shape.email }}
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
                    placeholder="doctor@telehealth.com"
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

            {/* Password */}
            <form.Field
              name="password"
              validators={{ onChange: loginSchema.shape.password }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={field.name}>Password</Label>
                    {/* Forgot password — wire up to /forgot-password route later */}
                    <button
                      className="text-muted-foreground text-xs hover:text-primary"
                      tabIndex={-1}
                      type="button"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      aria-invalid={field.state.meta.errors.length > 0}
                      className="pr-9"
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="••••••••"
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

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                checked={rememberMe}
                className="size-4 rounded border-input accent-primary"
                id="remember-me"
                onChange={(e) => setRememberMe(e.target.checked)}
                type="checkbox"
              />
              <label
                className="cursor-pointer select-none text-muted-foreground text-sm"
                htmlFor="remember-me"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <form.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting}
                  size="lg"
                  type="submit"
                >
                  {state.isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-border border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link
              className="font-medium text-primary hover:underline"
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
