import type { WizardStep } from "./schema";

export function ProgressBar(step: WizardStep) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
      <div className="mx-4 text-sm font-medium text-muted-foreground">Step {step} of 2</div>
      <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
    </div>
  );
}
