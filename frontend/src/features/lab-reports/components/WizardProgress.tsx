import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";

type WizardProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const progressValue = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <Progress value={progressValue}>
        <ProgressLabel>
          Step {currentStep} of {totalSteps}
        </ProgressLabel>
        <ProgressValue />
      </Progress>
    </div>
  );
}
