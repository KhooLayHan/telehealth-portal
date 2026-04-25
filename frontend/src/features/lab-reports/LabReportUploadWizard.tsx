import { Card } from "@/components/ui/card";
import { BiomarkersStep } from "./components/BiomarkersStep";
import { SuccessScreen } from "./components/SuccessScreen";
import { UploadStep } from "./components/UploadStep";
import { WizardProgress } from "./components/WizardProgress";
import { useWizard } from "./hooks/useWizard";
import type { LabReportUploadWizardProps } from "./schema";

export type { LabReportUploadWizardProps } from "./schema";

export function LabReportUploadWizard({
  patientPublicId,
  consultationPublicId,
}: LabReportUploadWizardProps) {
  const {
    step,
    labReportSlug,
    reportType,
    setReportType,
    handlePdfUploaded,
    handleReset,
    handleSuccess,
    goBack,
  } = useWizard();

  if (step === 3) {
    return <SuccessScreen reportType={reportType} onReset={handleReset} />;
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      <WizardProgress currentStep={step} totalSteps={2} />

      <Card className="shadow-lg">
        {step === 1 && (
          <UploadStep
            patientPublicId={patientPublicId}
            consultationPublicId={consultationPublicId}
            reportType={reportType}
            onReportTypeChange={setReportType}
            onUploadComplete={handlePdfUploaded}
          />
        )}

        {step === 2 && labReportSlug !== null && (
          <BiomarkersStep labReportSlug={labReportSlug} onBack={goBack} onSuccess={handleSuccess} />
        )}
      </Card>
    </div>
  );
}
