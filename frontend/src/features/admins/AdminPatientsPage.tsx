import { FileDown } from "lucide-react";
import { useEffect, useState } from "react";

import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import { Button } from "@/components/ui/button";
import { AddNewPatientForm } from "@/features/admins/managePatients/AddNewPatientForm";
import { PatientTable } from "@/features/admins/managePatients/PatientTable";
import { usePatientsCsvExport } from "@/features/admins/managePatients/UsePatientsCsvExport";

const PAGE_SIZE = 10;

// Displays the admin patient management page with a header and patient records table.
export function AdminPatientsPage() {
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { exportPatientsCsv, isExportDisabled } = usePatientsCsvExport();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading } = useGetAllPatientsForClinicStaff({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search.trim() || undefined,
  });

  const pagedResult = data?.status === 200 ? data.data : null;
  const patients = pagedResult?.items ?? [];
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Manage Patients</h1>
            <p className="text-lg text-muted-foreground">
              View, update, and manage registered patient records across the platform.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 bg-background"
              disabled={isExportDisabled}
              onClick={() => void exportPatientsCsv()}
            >
              <FileDown className="size-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-lg">Patient Records</h2>
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">{totalCount}</span>{" "}
            {totalCount === 1 ? "patient" : "patients"} found
          </p>
        </div>

        <PatientTable
          data={patients}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={setSearchInput}
          onAddNew={() => setAddPatientOpen(true)}
        />
      </section>

      <AddNewPatientForm open={addPatientOpen} onOpenChange={setAddPatientOpen} />
    </div>
  );
}
