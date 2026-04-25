import { Search, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { getBySlug, useGetAllLabReports } from "@/api/generated/lab-reports/lab-reports";
import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import type { LabReportDto } from "@/api/model/LabReportDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LabReportsStats } from "../components/LabReportsStats";
import { LabReportsTable } from "../components/LabReportsTable";
import { PatientLabReportsView } from "../components/PatientLabReportsView";
import { LabReportUploadWizard } from "../LabReportUploadWizard";

const PAGE_SIZE = 15;
const REPORT_PAGE_SIZE = 10;

type TabValue = "all" | "pending" | "completed" | "upload";

const tabs: { value: TabValue; label: string }[] = [
  { value: "all", label: "All Reports" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "upload", label: "Upload New" },
];

export function LabTechLabReportsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [reportSearch, setReportSearch] = useState("");
  const [reportPage, setReportPage] = useState(1);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPage, setPatientPage] = useState(1);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  // Fetch reports based on active tab
  const statusFilter =
    activeTab === "pending" ? "pending" : activeTab === "completed" ? "completed" : undefined;
  const { data: reportsData, isLoading: reportsLoading } = useGetAllLabReports({
    Search: reportSearch.trim() || undefined,
    Status: statusFilter,
    Page: reportPage,
    PageSize: REPORT_PAGE_SIZE,
  });

  const reportsResult = reportsData?.status === 200 ? reportsData.data : null;
  const allReports = reportsResult?.items ?? [];
  const reportTotalPages = Math.max(
    1,
    Math.ceil(Number(reportsResult?.totalCount ?? 0) / REPORT_PAGE_SIZE),
  );

  // Compute page-level counts; totalCount uses server total
  const { pendingCount, completedCount, totalCount } = useMemo(() => {
    const pending = allReports.filter((r) => r.status.slug === "pending").length;
    const completed = allReports.filter((r) => r.status.slug === "completed").length;
    return {
      pendingCount: pending,
      completedCount: completed,
      totalCount: Number(reportsResult?.totalCount ?? 0),
    };
  }, [allReports, reportsResult]);

  // Fetch full report history for selected patient
  const { data: patientReportsData } = useGetAllLabReports({
    PatientPublicId: selectedPatientId ?? undefined,
    PageSize: PAGE_SIZE,
  });

  const patientReports =
    patientReportsData?.status === 200 ? (patientReportsData.data.items ?? []) : [];

  // Fetch patients for upload tab
  const { data: patientsData, isLoading: patientsLoading } = useGetAllPatientsForClinicStaff({
    Search: patientSearch.trim() || undefined,
    Page: patientPage,
    PageSize: PAGE_SIZE,
  });

  const patientsResult = patientsData?.status === 200 ? patientsData.data : null;
  const patients = patientsResult?.items ?? [];
  const patientTotalCount = Number(patientsResult?.totalCount ?? 0);
  const patientTotalPages = Math.max(1, Math.ceil(patientTotalCount / PAGE_SIZE));

  // Find selected patient data
  const selectedPatient = useMemo(() => {
    return patients.find((p) => p.patientPublicId === selectedPatientId) ?? null;
  }, [patients, selectedPatientId]);

  const handleReportSearchChange = (value: string) => {
    setReportSearch(value);
    setReportPage(1);
  };

  const handlePatientSearchChange = (value: string) => {
    setPatientSearch(value);
    setPatientPage(1);
    setSelectedPatientId(null);
  };

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
    setReportPage(1);
    setReportSearch("");
    setSelectedPatientId(null);
    setShowWizard(false);
  };

  const handleViewReport = async (report: LabReportDto) => {
    try {
      const response = await getBySlug(report.slug);
      if (response.status === 200) {
        const url = response.data.downloadUrl; // typed, no assertion
        if (url) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    } catch {
      toast.error("Unable to open report. Please try again.");
    }
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    setShowWizard(false);
  };

  const handleUploadNew = () => {
    setShowWizard(true);
  };

  const handleBackToList = () => {
    setSelectedPatientId(null);
    setShowWizard(false);
  };

  // Patient detail / wizard view
  if (selectedPatientId && selectedPatient) {
    if (showWizard) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setShowWizard(false)}>
            Back to Patient
          </Button>
          <LabReportUploadWizard patientPublicId={selectedPatientId} consultationPublicId={null} />
        </div>
      );
    }

    return (
      <PatientLabReportsView
        patient={selectedPatient}
        reports={patientReports}
        onBack={handleBackToList}
        onUploadNew={handleUploadNew}
        onViewReport={handleViewReport}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Lab Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage lab reports, extract biomarkers, and notify patients
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav aria-label="Lab reports tabs" className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              aria-current={activeTab === tab.value ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "upload" ? (
        /* Upload New - Patient Search */
        <div className="space-y-6">
          <div className="relative max-w-md">
            <label htmlFor="patient-search" className="sr-only">
              Search patients
            </label>
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
            />
            <Input
              id="patient-search"
              placeholder="Search by patient name..."
              value={patientSearch}
              onChange={(e) => handlePatientSearchChange(e.target.value)}
              className="pl-10 pr-10"
            />
            {patientSearch && (
              <button
                type="button"
                aria-label="Clear patient search"
                onClick={() => handlePatientSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>

          {patientsLoading ? (
            <p className="text-muted-foreground">Loading patients...</p>
          ) : patients.length === 0 ? (
            <p className="text-muted-foreground">
              {patientSearch ? "No patients found." : "Type a name to search patients."}
            </p>
          ) : (
            <>
              <div className="grid gap-3">
                {patients.map((patient: ClinicStaffPatientDto) => (
                  <Card
                    key={patient.patientPublicId}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="size-5 text-primary" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-medium">{patient.fullName}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{patient.gender}</span>
                            <span>·</span>
                            <span>Blood: {patient.bloodGroup}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPatient(patient.patientPublicId ?? "");
                        }}
                      >
                        Select
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={patientPage <= 1}
                  onClick={() => setPatientPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-muted-foreground text-sm" aria-live="polite">
                  Page {patientPage} of {patientTotalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={patientPage >= patientTotalPages}
                  onClick={() => setPatientPage((p) => Math.min(patientTotalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* All Reports, Pending, Completed */
        <div className="space-y-6">
          <LabReportsStats
            pendingCount={pendingCount}
            completedCount={completedCount}
            totalCount={totalCount}
          />

          <LabReportsTable
            reports={allReports}
            isLoading={reportsLoading}
            search={reportSearch}
            onSearchChange={handleReportSearchChange}
            page={reportPage}
            totalPages={reportTotalPages}
            onPageChange={setReportPage}
            onViewReport={handleViewReport}
            emptyMessage={
              activeTab === "pending"
                ? "No pending reports. All caught up!"
                : activeTab === "completed"
                  ? "No completed reports yet."
                  : reportSearch
                    ? "No reports match your search."
                    : "No lab reports found."
            }
          />
        </div>
      )}
    </div>
  );
}
