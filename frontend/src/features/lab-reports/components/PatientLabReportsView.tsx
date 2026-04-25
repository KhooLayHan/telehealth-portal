import { ChevronLeft, FileText, Upload, User } from "lucide-react";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import type { LabReportDto } from "@/api/model/LabReportDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PatientLabReportsViewProps {
  patient: ClinicStaffPatientDto;
  reports: LabReportDto[];
  onBack: () => void;
  onUploadNew: () => void;
  onViewReport: (report: LabReportDto) => void;
}

function getStatusColor(slug: string): string {
  switch (slug.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function PatientLabReportsView({
  patient,
  reports,
  onBack,
  onUploadNew,
  onViewReport,
}: PatientLabReportsViewProps) {
  const pendingCount = reports.filter((r) => r.status.slug?.toLowerCase() === "pending").length;
  const completedCount = reports.filter((r) => r.status.slug?.toLowerCase() === "completed").length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ChevronLeft className="size-4 mr-1" aria-hidden="true" />
        Back to List
      </Button>

      {/* Patient Details Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-7 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{patient.fullName}</h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{patient.gender}</span>
                  <span>·</span>
                  <span>Blood: {patient.bloodGroup}</span>
                  {patient.allergies && patient.allergies.length > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600">
                        Allergies: {patient.allergies.map((a) => a.allergen).join(", ")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={onUploadNew}>
              <Upload className="size-4 mr-1" aria-hidden="true" />
              Upload New Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold text-amber-600">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending Reports</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-2xl font-semibold text-green-600">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed Reports</p>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        <h3 className="font-medium">Lab Reports History</h3>
        {reports.length === 0 ? (
          <div className="text-center py-8 border rounded-lg border-dashed">
            <FileText className="mx-auto size-8 text-muted-foreground mb-3" aria-hidden="true" />
            <p className="text-muted-foreground">No lab reports yet for this patient.</p>
            <Button variant="outline" className="mt-3" onClick={onUploadNew}>
              <Upload className="size-4 mr-1" aria-hidden="true" />
              Upload First Report
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <Card key={report.publicId} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FileText className="size-5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-medium">{report.reportType}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.createdAt
                          ? new Date(String(report.createdAt)).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(report.status.slug)}>
                      {report.status.name}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => onViewReport(report)}>
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
