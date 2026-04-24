import { useState } from "react";
import type { ReportType, WizardStep } from "../schema";

export function useWizard() {
  const [step, setStep] = useState<WizardStep>(1);
  const [labReportSlug, setLabReportSlug] = useState<string | null>(null);
  const [reportType, setReportType] = useState<ReportType>("Full Blood Count");

  const handlePdfUploaded = (slug: string) => {
    setLabReportSlug(slug);
    setStep(2);
  };

  const handleReset = () => {
    setStep(1);
    setLabReportSlug(null);
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
    labReportSlug,
    reportType,
    setReportType,
    handlePdfUploaded,
    handleReset,
    handleSuccess,
    goBack,
  };
}
