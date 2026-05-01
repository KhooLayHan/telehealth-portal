import { FileDown, Filter, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import type { GetAllPatientsForClinicStaffParams } from "@/api/model/GetAllPatientsForClinicStaffParams";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddNewPatientForm } from "@/features/admins/managePatients/AddNewPatientForm";
import { DeletePatientDialog } from "@/features/admins/managePatients/DeletePatientDialog";
import { EditPatientForm } from "@/features/admins/managePatients/EditPatientForm";
import { PatientTable } from "@/features/admins/managePatients/PatientTable";
import { usePatientsCsvExport } from "@/features/admins/managePatients/UsePatientsCsvExport";
import { ViewPatientDetailDialog } from "@/features/admins/managePatients/ViewPatientDetailDialog";

const PAGE_SIZE = 5;

// Lists the patient gender filters supported by the staff patients endpoint.
const GENDER_FILTER_OPTIONS = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
  { label: "Other", value: "O" },
  { label: "Not specified", value: "N" },
] as const;

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
  const [genderFilter, setGenderFilter] = useState("");
  const { exportPatientsCsv, isExportDisabled } = usePatientsCsvExport();
  const activeFilterCount = Number(Boolean(genderFilter));

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const patientListParams: GetAllPatientsForClinicStaffParams & { Gender?: string } = {
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search.trim() || undefined,
    Gender: genderFilter || undefined,
  };

  const { data, isLoading } = useGetAllPatientsForClinicStaff(patientListParams);

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
        toolbarActions={
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-fit gap-1.5 bg-background"
                  aria-label="Filter patients"
                >
                  <Filter className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="start" className="w-80 gap-4 p-4">
              <PopoverHeader>
                <PopoverTitle>Patient filters</PopoverTitle>
              </PopoverHeader>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={genderFilter ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      setGenderFilter("");
                      setPage(1);
                    }}
                  >
                    All
                  </Button>
                  {GENDER_FILTER_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={genderFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setGenderFilter(genderFilter === option.value ? "" : option.value);
                        setPage(1);
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setGenderFilter("");
                    setPage(1);
                  }}
                >
                  <X className="size-3.5" />
                  Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        }
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
