import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  GraduationCap,
  Plus,
  Search,
  Stethoscope,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getGetAllQueryKey, useDeleteDoctorById, useGetAll } from "@/api/generated/doctors/doctors";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import { ApiError } from "@/api/ofetch-mutator";
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
import { AddNewDoctorForm } from "./manageDoctors/components/AddNewDoctorForm";
import { DoctorCard } from "./manageDoctors/components/DoctorCard";
import { EditDoctorForm } from "./manageDoctors/components/EditDoctorForm";

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

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

function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  if (!doctor) return null;

  const initials = `${(doctor.firstName ?? "?")[0]}${(doctor.lastName ?? "?")[0]}`;
  const fullAddress = doctor.address
    ? `${doctor.address.street}, ${doctor.address.city}, ${doctor.address.state} ${doctor.address.postalCode}, ${doctor.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5 shrink-0" />
                  {doctor.specialization ?? ""}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{doctor.licenseNumber ?? ""}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {doctor.bio && (
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {doctor.bio}
            </div>
          )}

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={doctor.gender ?? ""} />
            <DetailRow label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <DetailRow label="Username" value={doctor.username ?? ""} />
          </div>

          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Qualifications
          </p>
          <div className="mb-5 space-y-2">
            {(doctor.qualifications ?? []).map((q) => (
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

interface EditDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditDoctorDialog({ doctor, open, onOpenChange }: EditDoctorDialogProps) {
  if (!doctor) return null;
  return <EditDoctorForm doctor={doctor} open={open} onOpenChange={onOpenChange} />;
}

interface DeleteDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DeleteDoctorDialog({ doctor, open, onOpenChange }: DeleteDoctorDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useDeleteDoctorById();

  if (!doctor) return null;

  const handleConfirm = async () => {
    try {
      await mutateAsync({ id: String(doctor.doctorPublicId) });
      toast.success(`Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""} has been removed.`);
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data?.title ?? "Failed to delete doctor.");
      } else {
        toast.error("Failed to delete doctor.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-lg font-semibold">Delete Doctor</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListDto | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<DoctorListDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDoctorForDelete, setSelectedDoctorForDelete] = useState<DoctorListDto | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading, isError } = useGetAll();
  const allDoctors = data?.status === 200 ? data.data : [];
  const departmentCount = useMemo(
    () => new Set(allDoctors.map((d: DoctorListDto) => d.departmentName).filter(Boolean)).size,
    [allDoctors],
  );

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
        `${d.firstName ?? ""} ${d.lastName ?? ""}`.toLowerCase().includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        (d.username ?? "").toLowerCase().includes(q) ||
        (d.specialization ?? "").toLowerCase().includes(q) ||
        (d.departmentName ?? "").toLowerCase().includes(q) ||
        (d.licenseNumber ?? "").toLowerCase().includes(q),
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
              <BreadcrumbPage>Doctor Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Doctor Directory</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" className="gap-1.5 bg-white text-black hover:bg-muted">
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              className="gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add New Doctor
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading…"
            : `Manage ${filtered.length} registered medical professional${filtered.length === 1 ? "" : "s"} across ${departmentCount} department${departmentCount === 1 ? "" : "s"}.`}
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Search by name, specialty, license…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading doctors…</p>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-destructive">Failed to load doctors.</p>
      ) : paged.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No doctors found.</p>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {paged.map((doctor: DoctorListDto) => (
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
                const d = allDoctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctor(d);
                  setDetailsOpen(true);
                }
              }}
              onEditProfile={(id) => {
                const d = allDoctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctorForEdit(d);
                  setEditOpen(true);
                }
              }}
              onRemove={(id) => {
                const d = allDoctors.find((x) => String(x.doctorPublicId) === id);
                if (d) {
                  setSelectedDoctorForDelete(d);
                  setDeleteOpen(true);
                }
              }}
              onSchedule={() => {
                toast.info("Schedule management coming soon.");
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

      <DoctorDetailsDialog
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

      <AddNewDoctorForm open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
