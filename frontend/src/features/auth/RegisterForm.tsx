import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BrandingHeader } from "./components/BrandingHeader";
import { FormError } from "./components/FormError";
import { RegisterAccountSection } from "./components/RegisterAccountSection";
import { RegisterPersonalInfoSection } from "./components/RegisterPersonalInfoSection";
import { TermsCheckbox } from "./components/TermsCheckbox";
import { useRegisterForm } from "./hooks/useRegisterForm";

export function RegisterForm() {
  const { form, globalError, acceptTerms, setAcceptTerms } = useRegisterForm();

  return (
    <div className="space-y-6">
      <BrandingHeader />

      <Card className="shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Join TeleHealth to access quality healthcare</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="space-y-6"
            onSubmit={async (e) => {
              e.preventDefault();
              e.stopPropagation();

              if (!acceptTerms) {
                return;
              }
              await form.handleSubmit();
            }}
          >
            {globalError && <FormError message={globalError} />}

            <RegisterPersonalInfoSection form={form} />

            <Separator />

            <RegisterAccountSection form={form} />

            <TermsCheckbox checked={acceptTerms} onCheckedChange={setAcceptTerms} />

            <form.Subscribe>
              {(state) => (
                <Button
                  className="w-full"
                  disabled={!state.canSubmit || state.isSubmitting || !acceptTerms}
                  size="lg"
                  type="submit"
                >
                  {state.isSubmitting ? "Creating account..." : "Create account"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="mt-6 text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" to="/login">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
