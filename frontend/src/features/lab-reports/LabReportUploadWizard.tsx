import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BiomarkersForm } from "./biomarker/BiomarkersForm";
import { S3PdfDropzone } from "./dropzone/S3PdfDropzone";

export function LabReportUploadWizard({ patientPublicId }: { patientPublicId: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [labReportId, setLabReportId] = useState<string>("");
  const [reportType, setReportType] = useState<string>("");

  const handlePdfUploaded = (id: string, type: string) => {
    setLabReportId(id);
    setReportType(type);
    setStep(2);
  };

  if (step === 3) {
    return (
      <Card className="shadow-lg border-green-500/20">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-green-100 p-3 text-green-600">
            <CheckCircle2 className="size-12" />
          </div>
          <CardTitle className="text-2xl">Report Published!</CardTitle>
          <CardDescription className="max-w-sm mx-auto">
            The {reportType} report has been securely saved, and the patient has been notified via
            email.
          </CardDescription>
          <Button className="mt-4" onClick={() => setStep(1)} variant="outline">
            Upload Another
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-4">
      {/* Progress Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className="mx-4 text-sm font-medium text-muted-foreground">Step {step} of 2</div>
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">
            {step === 1 ? "Upload PDF Report" : "Extract Biomarkers"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Securely upload the raw lab results directly to Amazon S3."
              : "Input key metrics to make them searchable and trendable for the doctor."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <S3PdfDropzone patientPublicId={patientPublicId} onUploadSuccess={handlePdfUploaded} />
          )}
          {step === 2 && (
            <BiomarkersForm
              labReportId={labReportId}
              onBack={() => setStep(1)}
              onSuccess={() => setStep(3)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
