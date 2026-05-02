import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Filter, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import { getAll, useGetAll } from "@/api/generated/doctors/doctors";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AddNewDoctorForm } from "./manageDoctors/components/AddNewDoctorForm";
import { DeleteDoctorDialog } from "./manageDoctors/components/DeleteDoctorDialog";
import { DoctorCard } from "./manageDoctors/components/DoctorCard";
import { EditDoctorForm } from "./manageDoctors/components/EditDoctorForm";
import { ViewDoctorDetailDialog } from "./manageDoctors/components/ViewDoctorDetailDialog";
import { ViewDoctorScheduleDialog } from "./manageDoctors/components/ViewDoctorScheduleDialog";

const ACCENT = "#0d9488";
const PAGE_SIZE = 6;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Defines one exported doctor CSV column and how its value is read.
interface DoctorCsvColumn {
  header: string;
  getValue: (doctor: DoctorListDto) => unknown;
}

// Lists the doctor fields exported by the CSV download.
const DOCTOR_CSV_COLUMNS: DoctorCsvColumn[] = [
  { header: "Doctor Public ID", getValue: (doctor) => doctor.doctorPublicId },
  { header: "Slug", getValue: (doctor) => doctor.slug },
  { header: "First Name", getValue: (doctor) => doctor.firstName },
  { header: "Last Name", getValue: (doctor) => doctor.lastName },
  { header: "Username", getValue: (doctor) => doctor.username },
  { header: "Email", getValue: (doctor) => doctor.email },
  { header: "Phone Number", getValue: (doctor) => doctor.phoneNumber },
  { header: "Gender", getValue: (doctor) => doctor.gender },
  { header: "Date of Birth", getValue: (doctor) => doctor.dateOfBirth },
  { header: "Specialization", getValue: (doctor) => doctor.specialization },
  { header: "Department", getValue: (doctor) => doctor.departmentName },
  { header: "License Number", getValue: (doctor) => doctor.licenseNumber },
  { header: "Consultation Fee MYR", getValue: (doctor) => doctor.consultationFee },
  { header: "Address Street", getValue: (doctor) => doctor.address?.street },
  { header: "Address City", getValue: (doctor) => doctor.address?.city },
  { header: "Address State", getValue: (doctor) => doctor.address?.state },
  { header: "Address Postal Code", getValue: (doctor) => doctor.address?.postalCode },
  { header: "Address Country", getValue: (doctor) => doctor.address?.country },
  {
    header: "Qualifications",
    getValue: (doctor) =>
      (doctor.qualifications ?? [])
        .map((qualification) =>
          [qualification.degree, qualification.institution, qualification.year]
            .filter(Boolean)
            .join(" - "),
        )
        .join("; "),
  },
  { header: "Bio", getValue: (doctor) => doctor.bio },
  { header: "Created At", getValue: (doctor) => doctor.createdAt },
];

// Converts a single value to a safe CSV cell.
function formatCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const safeText = CSV_FORMULA_PREFIX_PATTERN.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

// Builds the full doctors CSV document from the loaded records.
function buildDoctorsCsv(doctors: DoctorListDto[]): string {
  const header = DOCTOR_CSV_COLUMNS.map((column) => formatCsvCell(column.header)).join(",");
  const rows = doctors.map((doctor) =>
    DOCTOR_CSV_COLUMNS.map((column) => formatCsvCell(column.getValue(doctor))).join(","),
  );
  return [header, ...rows].join("\r\n");
}

interface EditDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditDoctorDialog({ doctor, open, onOpenChange }: EditDoctorDialogProps) {
  if (!doctor) return null;
  return <EditDoctorForm doctor={doctor} open={open} onOpenChange={onOpenChange} />;
}

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListDto | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<DoctorListDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDoctorForDelete, setSelectedDoctorForDelete] = useState<DoctorListDto | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDoctorForSchedule, setSelectedDoctorForSchedule] = useState<DoctorListDto | null>(
    null,
  );
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, isError } = useGetAll({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
    Department: departmentFilter || undefined,
    Specialization: specializationFilter || undefined,
  });
  const { data: directoryData } = useGetAll({ Page: 1, PageSize: 50 });
  const { data: departmentsData } = useAdminGetAllDepartments({ Page: 1, PageSize: 50 });
  const result = data?.status === 200 ? data.data : null;
  const doctors = result?.items ?? [];
  const directoryDoctors = directoryData?.status === 200 ? directoryData.data.items : [];
  const departmentOptions = useMemo(
    () =>
      (departmentsData?.status === 200 ? departmentsData.data.items : [])
        .map((department) => department.name)
        .filter((department): department is string => Boolean(department))
        .sort((a, b) => a.localeCompare(b)),
    [departmentsData],
  );
  const departmentCount = departmentOptions.length;
  const specializationOptions = useMemo(
    () =>
      Array.from(
        new Set(
          directoryDoctors
            .map((doctor: DoctorListDto) => doctor.specialization)
            .filter((specialization): specialization is string => Boolean(specialization)),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [directoryDoctors],
  );
  const activeFilterCount =
    Number(Boolean(departmentFilter)) + Number(Boolean(specializationFilter));
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = Math.max(1, result ? Number(result.totalPages ?? 1) : 1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!(isLoading || isError) && page > totalPages) {
      setPage(totalPages);
    }
  }, [isError, isLoading, page, totalPages]);

  const handleExportCsv = async () => {
    if (totalCount === 0) {
      toast.info("No doctor records available to export.");
      return;
    }

    try {
      const exportPageSize = 50;
      const firstResponse = await getAll({
        Page: 1,
        PageSize: exportPageSize,
        Search: search || undefined,
        Department: departmentFilter || undefined,
        Specialization: specializationFilter || undefined,
      });

      if (firstResponse.status !== 200) {
        toast.error("Failed to export doctor records.");
        return;
      }

      const exportedDoctors = [...firstResponse.data.items];
      const exportTotalPages = Number(firstResponse.data.totalPages ?? 1);

      for (let exportPage = 2; exportPage <= exportTotalPages; exportPage++) {
        const response = await getAll({
          Page: exportPage,
          PageSize: exportPageSize,
          Search: search || undefined,
          Department: departmentFilter || undefined,
          Specialization: specializationFilter || undefined,
        });

        if (response.status !== 200) {
          toast.error("Failed to export doctor records.");
          return;
        }

        exportedDoctors.push(...response.data.items);
      }

      const csv = buildDoctorsCsv(exportedDoctors);
      const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `doctors-${today}.csv`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(
        `Exported ${exportedDoctors.length} doctor record${exportedDoctors.length === 1 ? "" : "s"}.`,
      );
    } catch {
      toast.error("Failed to export doctor records.");
    }
  };

  return (
    <>
      <div className="mb-6 space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Doctor Directory</h1>
            <p className="text-lg text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Manage ${totalCount} registered medical professional${totalCount === 1 ? "" : "s"} across ${departmentCount} department${departmentCount === 1 ? "" : "s"}.`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
            <Button
              variant="outline"
              className="h-9 gap-1.5 bg-white text-black hover:bg-muted"
              disabled={isLoading || isError}
              onClick={handleExportCsv}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              className="h-9 gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add New Doctor
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Search by name, specialty, license…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                className="h-9 w-fit gap-1.5 bg-background"
                aria-label="Filter doctors"
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
              <PopoverTitle>Doctor filters</PopoverTitle>
            </PopoverHeader>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Department</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={departmentFilter ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setDepartmentFilter("");
                    setPage(1);
                  }}
                >
                  All
                </Button>
                {departmentOptions.map((department) => (
                  <Button
                    key={department}
                    type="button"
                    variant={departmentFilter === department ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setDepartmentFilter(departmentFilter === department ? "" : department);
                      setPage(1);
                    }}
                  >
                    {department}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Specialization</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={specializationFilter ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setSpecializationFilter("");
                    setPage(1);
                  }}
                >
                  All
                </Button>
                {specializationOptions.map((specialization) => (
                  <Button
                    key={specialization}
                    type="button"
                    variant={specializationFilter === specialization ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSpecializationFilter(
                        specializationFilter === specialization ? "" : specialization,
                      );
                      setPage(1);
                    }}
                  >
                    {specialization}
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
                  setDepartmentFilter("");
                  setSpecializationFilter("");
                  setPage(1);
                }}
              >
                <X className="size-3.5" />
                Clear filters
              </Button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading doctors…</p>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-destructive">Failed to load doctors.</p>
      ) : doctors.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No doctors found.</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {doctors.map((doctor: DoctorListDto) => (
            <DoctorCard
              key={String(doctor.doctorPublicId)}
              doctor={{
                publicId: String(doctor.doctorPublicId),
                name: `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim(),
                specialty: doctor.specialization ?? "",
                department: doctor.departmentName ?? "",
                email: doctor.email ?? "",
                phone: doctor.phoneNumber ?? "—",
                joinedDate: String(doctor.createdAt ?? ""),
                feePerSessionMyr: Number(doctor.consultationFee ?? 0),
                isOnDuty: false,
                licenseNo: doctor.licenseNumber ?? "",
              }}
              onViewDetails={(id) => {
                const d = doctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctor(d);
                  setDetailsOpen(true);
                }
              }}
              onEditProfile={(id) => {
                const d = doctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctorForEdit(d);
                  setEditOpen(true);
                }
              }}
              onRemove={(id) => {
                const d = doctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctorForDelete(d);
                  setDeleteOpen(true);
                }
              }}
              onSchedule={(id) => {
                const d = doctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctorForSchedule(d);
                  setScheduleOpen(true);
                }
              }}
            />
          ))}
        </motion.div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push(`ellipsis-after-${arr[idx - 1]}`);
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    style={item === page ? { background: ACCENT } : undefined}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <ViewDoctorDetailDialog
        doctor={selectedDoctor}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <EditDoctorDialog
        key={selectedDoctorForEdit ? String(selectedDoctorForEdit.doctorPublicId) : "none"}
        doctor={selectedDoctorForEdit}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteDoctorDialog
        doctor={selectedDoctorForDelete}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />

      <ViewDoctorScheduleDialog
        doctor={selectedDoctorForSchedule}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
      />

      <AddNewDoctorForm open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
