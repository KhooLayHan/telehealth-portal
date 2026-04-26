import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import { Button } from "@/components/ui/button";
import { AddNewPatientForm } from "@/features/admins/managePatients/AddNewPatientForm";
import { DeletePatientDialog } from "@/features/admins/managePatients/DeletePatientDialog";
import { EditPatientForm } from "@/features/admins/managePatients/EditPatientForm";
import { PatientTable } from "@/features/admins/managePatients/PatientTable";
import { usePatientsCsvExport } from "@/features/admins/managePatients/UsePatientsCsvExport";
import { ViewPatientDetailDialog } from "@/features/admins/managePatients/ViewPatientDetailDialog";

const PAGE_SIZE = 5;

// Displays the admin patient management page with a header and patient records table.
export function AdminPatientsPage() {
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [viewPatientOpen, setViewPatientOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [editPatientOpen, setEditPatientOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [deletePatientOpen, setDeletePatientOpen] = useState(false);
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

  const handleViewPatient = (patient: ClinicStaffPatientDto) => {
    setSelectedPatient(patient);
    setViewPatientOpen(true);
  };

  const handleEditPatient = (patient: ClinicStaffPatientDto) => {
    setEditingPatient(patient);
    setEditPatientOpen(true);
  };

  const handleRemovePatient = (patient: ClinicStaffPatientDto) => {
    setDeletingPatient(patient);
    setDeletePatientOpen(true);
  };

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
            <Button
              type="button"
              className="h-9 gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddPatientOpen(true)}
            >
              <Plus className="size-4" />
              Add New Patient
            </Button>
          </div>
        </div>
      </header>

      <PatientTable
        data={patients}
        isLoading={isLoading}
        page={page}
        totalCount={totalCount}
        totalPages={totalPages}
        onPageChange={setPage}
        search={searchInput}
        onSearchChange={setSearchInput}
        onView={handleViewPatient}
        onEdit={handleEditPatient}
        onRemove={handleRemovePatient}
      />

      <AddNewPatientForm open={addPatientOpen} onOpenChange={setAddPatientOpen} />
      <EditPatientForm
        patient={editingPatient}
        open={editPatientOpen}
        onOpenChange={setEditPatientOpen}
      />
      <DeletePatientDialog
        patient={deletingPatient}
        open={deletePatientOpen}
        onOpenChange={setDeletePatientOpen}
      />
      <ViewPatientDetailDialog
        patient={selectedPatient}
        open={viewPatientOpen}
        onOpenChange={setViewPatientOpen}
      />
    </div>
  );
}
