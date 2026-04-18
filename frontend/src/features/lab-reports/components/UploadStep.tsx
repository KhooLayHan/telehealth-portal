import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { S3PdfDropzone } from "../dropzone/S3PdfDropzone";
import type { ReportType } from "../schema";
import { ReportTypeSelector } from "./ReportTypeSelector";

type UploadStepProps = {
  patientPublicId: string;
  consultationPublicId?: string | null;
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  onUploadComplete: (id: string) => void;
};

export function UploadStep({
  patientPublicId,
  consultationPublicId,
  reportType,
  onReportTypeChange,
  onUploadComplete,
}: UploadStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Upload PDF Report</CardTitle>
        <CardDescription>
          Securely upload the raw lab results directly to Amazon S3.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ReportTypeSelector value={reportType} onChange={onReportTypeChange} />
        <S3PdfDropzone
          patientPublicId={patientPublicId}
          consultationPublicId={consultationPublicId}
          reportType={reportType}
          onUploadComplete={onUploadComplete}
        />
      </CardContent>
    </>
  );
}
