import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Activity, Heart, Shield } from "lucide-react";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left branding panel */}
      <div className="relative hidden flex-col items-start justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Heart className="size-5" />
          <span>TeleHealth</span>
        </div>

        <div className="space-y-5">
          <h2 className="font-bold text-3xl leading-tight">
            Healthcare at your
            <br />
            fingertips.
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary-foreground/10 p-2">
                <Shield className="size-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Secure &amp; Private</p>
                <p className="text-primary-foreground/60 text-xs">
                  HIPAA compliant healthcare platform
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary-foreground/10 p-2">
                <Activity className="size-4" />
              </div>
              <div>
                <p className="font-medium text-sm">Real-time Care</p>
                <p className="text-primary-foreground/60 text-xs">
                  Connect with doctors anytime, anywhere
                </p>
              </div>
            </div>
          </div>
        </div>

        <blockquote className="space-y-1 border-primary-foreground/30 border-l-2 pl-4">
          <p className="text-primary-foreground/90 text-sm italic">
            "The good physician treats the disease; the great physician treats the patient who has
            the disease."
          </p>
          <footer className="text-primary-foreground/50 text-xs">William Osler</footer>
        </blockquote>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center overflow-y-auto p-6 lg:p-12">
        <div className="w-full max-w-md py-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
