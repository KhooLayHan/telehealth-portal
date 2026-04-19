import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Pencil,
  Search,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useGetAll } from "@/api/generated/doctors/doctors";
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

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Formats a date string or NodaTime Instant as "15 Apr 1982"
function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row inside the detail dialog
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

interface DoctorDetailsDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full doctor profile not visible in the table
function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  if (!doctor) return null;

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;
  const fullAddress = doctor.address
    ? `${doctor.address.street}, ${doctor.address.city}, ${doctor.address.state} ${doctor.address.postalCode}, ${doctor.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header band with accent colour */}
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
                  Dr. {doctor.firstName} {doctor.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5 shrink-0" />
                  {doctor.specialization}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{doctor.licenseNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Bio */}
          {doctor.bio && (
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {doctor.bio}
            </div>
          )}

          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={doctor.gender} />
            <DetailRow label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <DetailRow label="Username" value={doctor.username} />
          </div>

          {/* Address */}
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>

          {/* Qualifications */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Qualifications
          </p>
          <div className="mb-5 space-y-2">
            {doctor.qualifications.map((q) => (
              <div
                key={`${q.degree}-${q.year}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{q.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.institution} · {q.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<DoctorListDto>[] = [
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
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => <span className="text-sm">{row.getValue("departmentName")}</span>,
  },
  {
    accessorKey: "specialization",
    header: "Specialty",
    cell: ({ row }) => (
      <span
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
        style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
      >
        {row.getValue("specialization")}
      </span>
    ),
  },
  {
    accessorKey: "licenseNumber",
    header: "License No.",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("licenseNumber")}</span>,
  },
  {
    accessorKey: "consultationFee",
    header: "Fee (MYR)",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        RM {(row.getValue<number | null>("consultationFee") ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("phoneNumber") || "—"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.getValue("createdAt"))}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="View details"
          onClick={() =>
            (table.options.meta as { onView: (d: DoctorListDto) => void }).onView(row.original)
          }
        >
          <Eye className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          title="Edit doctor"
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

interface DataTableProps {
  data: DoctorListDto[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (doctor: DoctorListDto) => void;
}

function DataTable({
  data,
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
      <div className="relative w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, username, email, specialty or license…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-9 pl-9 text-sm"
        />
      </div>

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
                  <p className="text-sm text-muted-foreground">No doctors found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Try adjusting your search.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading } = useGetAll();
  const allDoctors = data?.status === 200 ? data.data : [];

  const handleView = (doctor: DoctorListDto) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!search) return allDoctors;
    const q = search.toLowerCase();
    return allDoctors.filter(
      (d: DoctorListDto) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.departmentName.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q),
    );
  }, [search, allDoctors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage all registered doctors
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="flex items-end justify-between px-6 pb-4 pt-6">
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Doctors
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">All Doctors</h1>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading…"
              ) : (
                <>
                  <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "doctor" : "doctors"} found
                </>
              )}
            </p>
          </div>

          <Separator />

          <div className="p-6">
            <DataTable
              data={paged}
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

      <DoctorDetailsDialog doctor={selectedDoctor} open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
