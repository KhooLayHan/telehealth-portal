export const REPORT_TYPES = [
  "Full Blood Count",
  "Liver Function Test",
  "Kidney Function Test",
  "Lipid Panel",
  "Thyroid Function Test",
  "HbA1c",
  "Urinalysis",
  "Other",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];
export type WizardStep = 1 | 2 | 3;

export type LabReportUploadWizardProps = {
  patientPublicId: string;
  consultationPublicId?: string | null;
};
