import type { WizardStep } from "./schema";

const STEPS = [
  { number: 1, label: "Schedule" },
  { number: 2, label: "Medical Details" },
] as const;

export function ProgressBar({ step }: { step: WizardStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
        {STEPS.map((s, idx) => {
          const isActive = step === s.number;

          return (
            <div key={s.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    step >= s.number
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.number}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>

              {idx < STEPS.length - 1 && (
                <div
                  className={`mx-3 mt-[-12px] h-0.5 flex-1 rounded-full transition-colors ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
