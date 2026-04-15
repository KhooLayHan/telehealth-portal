import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandingHeader } from "./components/BrandingHeader";
import { FormError } from "./components/FormError";
import { LoginEmailField } from "./components/LoginEmailField";
import { LoginPasswordField } from "./components/LoginPasswordField";
import { RememberMeCheckbox } from "./components/RememberMeCheckbox";
import { useLoginForm } from "./hooks/useLoginForm";
import { loginSchema } from "./schemas/loginSchema";

export function LoginForm() {
  const { form, globalError } = useLoginForm();
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <div className="space-y-6">
      <BrandingHeader />

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
            {globalError && <FormError message={globalError} />}

            <form.Field name="email" validators={{ onChange: loginSchema.shape.email }}>
              {(field) => <LoginEmailField field={field} />}
            </form.Field>

            <form.Field name="password" validators={{ onChange: loginSchema.shape.password }}>
              {(field) => <LoginPasswordField field={field} />}
            </form.Field>

            <RememberMeCheckbox checked={rememberMe} onCheckedChange={setRememberMe} />

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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-border border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-muted-foreground text-sm">
            Don't have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
