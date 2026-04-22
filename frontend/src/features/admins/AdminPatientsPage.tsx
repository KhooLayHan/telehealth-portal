import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Phone,
  Search,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { AllergyDto } from "@/api/model/AllergyDto";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import type { EmergencyContactDto } from "@/api/model/EmergencyContactDto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Teal accent colour shared with the doctors page
const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Allergy severity colour mapping for badges
const SEVERITY_COLORS: Record<string, string> = {
  mild: "#10b981",
  moderate: "#f59e0b",
  severe: "#ef4444",
  critical: "#7c3aed",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// Formats an ISO date string as "15 Apr 1992"
function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Returns a human-readable gender label from the single-character code
function genderLabel(code: string | null): string {
  if (!code) return "—";
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not Specified" };
  return map[code] ?? code;
}

// ── Detail row ─────────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row rendered inside the patient detail dialog
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

// ── Patient details dialog ─────────────────────────────────────────────────────

interface PatientDetailsDialogProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal that displays the full patient profile not visible in the table
function PatientDetailsDialog({ patient, open, onOpenChange }: PatientDetailsDialogProps) {
  if (!patient) return null;

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Accent top bar */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar / initials */}
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {patient.firstName} {patient.lastName}
                </DialogTitle>
                {patient.bloodGroup && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{
                      borderColor: ACCENT,
                      color: ACCENT,
                      backgroundColor: `${ACCENT}12`,
                    }}
                  >
                    <Heart className="size-2.5" />
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-sm">
                {genderLabel(patient.gender)} · {patient.phoneNumber || "No phone on record"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(patient.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            <DetailRow label="Phone" value={patient.phoneNumber || "—"} />
            <DetailRow label="Blood Group" value={patient.bloodGroup || "—"} />
          </div>

          {/* Allergies */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Allergies
          </p>
          <div className="mb-5 space-y-2">
            {!patient.allergies || patient.allergies.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                No known allergies.
              </p>
            ) : (
              patient.allergies.map((allergy) => (
                <div
                  key={`${allergy.allergen}-${allergy.severity}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: SEVERITY_COLORS[allergy.severity] ?? "#6b7280" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{allergy.allergen}</p>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white"
                        style={{
                          backgroundColor: SEVERITY_COLORS[allergy.severity] ?? "#6b7280",
                        }}
                      >
                        {allergy.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{allergy.reaction}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Emergency contact */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Emergency Contact
          </p>
          {patient.emergencyContact ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{patient.emergencyContact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.emergencyContact.relationship} · {patient.emergencyContact.phone}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No emergency contact on record.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Table column definitions ───────────────────────────────────────────────────

// Column definitions for the patient records data table
const columns: ColumnDef<ClinicStaffPatientDto>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<string>("phoneNumber") || "—"}</span>
    ),
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("dateOfBirth"))}</span>,
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
      <span className="text-xs">{genderLabel(row.getValue<string | null>("gender"))}</span>
    ),
  },
  {
    accessorKey: "bloodGroup",
    header: "Blood Group",
    cell: ({ row }) => {
      const bg = row.getValue<string>("bloodGroup");
      return bg ? (
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
          style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
        >
          <Heart className="size-2.5" />
          {bg}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      );
    },
  },
  {
    accessorKey: "allergies",
    header: "Allergies",
    cell: ({ row }) => {
      const allergies = row.getValue<AllergyDto[] | null>("allergies");
      if (!allergies || allergies.length === 0) {
        return <span className="text-xs text-muted-foreground">None</span>;
      }
      const severityOrder = ["mild", "moderate", "severe", "critical"];
      const highestSeverity = allergies.reduce((acc, a) => {
        return severityOrder.indexOf(a.severity) > severityOrder.indexOf(acc) ? a.severity : acc;
      }, "mild");
      return (
        <div className="flex items-center gap-1.5">
          <AlertCircle
            className="size-3.5 shrink-0"
            style={{ color: SEVERITY_COLORS[highestSeverity] ?? "#6b7280" }}
          />
          <span className="text-xs">
            {allergies.length} {allergies.length === 1 ? "allergy" : "allergies"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "emergencyContact",
    header: "Emergency Contact",
    cell: ({ row }) => {
      const ec = row.getValue<EmergencyContactDto | null>("emergencyContact");
      if (!ec) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex items-center gap-1.5">
          <Phone className="size-3 shrink-0 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-xs font-medium">{ec.name}</span>
            <span className="text-[11px] text-muted-foreground">{ec.relationship}</span>
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onView: (p: ClinicStaffPatientDto) => void;
      };
      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="View patient details"
          onClick={() => meta.onView(row.original)}
        >
          <Eye className="size-3.5" />
        </Button>
      );
    },
  },
];

// ── Data table component ───────────────────────────────────────────────────────

interface DataTableProps {
  data: ClinicStaffPatientDto[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (patient: ClinicStaffPatientDto) => void;
}

// Renders the paginated, searchable patient records table
function DataTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onView,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-foreground/20 bg-foreground hover:bg-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading patients…" : "No patients found."}
                  </p>
                  {!isLoading && (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Try adjusting your search.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
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
              onClick={() => onPageChange(page - 1)}
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
                    onClick={() => onPageChange(item)}
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
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

// Admin page for viewing all registered patient user records
export function AdminPatientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Debounce the search input by 400 ms and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch patients from the backend with server-side search and pagination
  const { data, isLoading } = useGetAllPatientsForClinicStaff({
    Search: search.trim() || undefined,
    Page: page,
    PageSize: PAGE_SIZE,
  });

  const pagedResult = data?.status === 200 ? data.data : null;
  const patients = pagedResult?.items ?? [];
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleView = (patient: ClinicStaffPatientDto) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  return (
    <>
      {/* Breadcrumb + subtitle */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patient Records</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View all registered patient user records
        </p>
      </div>

      {/* Page card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          {/* Accent top line */}
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="flex items-end justify-between px-6 pb-4 pt-6">
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Patients
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Patient Records
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCount}</span>{" "}
              {totalCount === 1 ? "patient" : "patients"} found
            </p>
          </div>

          <Separator />

          <div className="p-6">
            <DataTable
              data={patients}
              isLoading={isLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={searchInput}
              onSearchChange={setSearchInput}
              onView={handleView}
            />
          </div>
        </div>
      </motion.div>

      {/* Patient details dialog */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
