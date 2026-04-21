import { ChevronRight, Search, User, X } from "lucide-react";
import { useState } from "react";
import { useClinicStaffGetAllPatients } from "@/api/generated/patients/patients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LabReportUploadWizard } from "../LabReportUploadWizard";

const PAGE_SIZE = 15;

export function LabTechLabReportsPage() {
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useClinicStaffGetAllPatients({
    Search: search.trim() || undefined,
    Page: page,
    PageSize: PAGE_SIZE,
  });

  const patients = data?.data?.items ?? [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setSelectedPatientId(null);
  };

  if (selectedPatientId) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setSelectedPatientId(null)}>
          Back to Patient Search
        </Button>
        <LabReportUploadWizard patientPublicId={selectedPatientId} consultationPublicId={null} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Lab Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Search for a patient to upload their lab report
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by patient name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading patients...</p>
      ) : patients.length === 0 ? (
        <p className="text-muted-foreground">
          {search ? "No patients found." : "Type a name to search patients."}
        </p>
      ) : (
        <div className="grid gap-3">
          {patients.map((patient) => (
            <Card
              key={patient.patientPublicId}
              className="hover:border-primary/50 transition-colors"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{patient.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.gender} · {patient.age} yrs
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedPatientId(patient.patientPublicId ?? null)}
                  size="sm"
                >
                  Select <ChevronRight className="size-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
