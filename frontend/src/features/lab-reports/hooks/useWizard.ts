import { useState } from "react";
import type { ReportType, WizardStep } from "../schema";

export function useWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [labReportId, setLabReportId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("Full Blood Count");

  const handlePdfUploaded = (id: string) => {
    setLabReportId(id);
    setStep(2);
  };

  const handleReset = () => {
    setStep(1);
    setLabReportId(null);
    setReportType("Full Blood Count");
  };

  const handleSuccess = () => {
    setStep(3);
  };

  const goBack = () => {
    setStep(1);
  };

  return {
    step,
    labReportId,
    reportType,
    setReportType,
    handlePdfUploaded,
    handleReset,
    handleSuccess,
    goBack,
  };
}
