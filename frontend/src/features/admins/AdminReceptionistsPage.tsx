import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminDeactivateReceptionist,
  useAdminGetAllReceptionists,
} from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AddNewReceptionistForm } from "@/features/admins/manageReceptionists/AddNewReceptionistForm";
import { EditReceptionistForm } from "@/features/admins/manageReceptionists/EditReceptionistForm";
import { ReceptionistTable } from "@/features/admins/manageReceptionists/ReceptionistTable";

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;
const RECEPTIONISTS_CSV_HEADERS = ["Name", "Username", "Email", "Phone", "Joined"] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;

// Maps gender code to a readable label
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a date string as "15 Apr 1982"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Escapes one cell so commas, quotes, and line breaks remain valid CSV content.
function escapeCsvCell(value: string | null | undefined): string {
  const normalizedValue = String(value ?? "")
    .replace(WINDOWS_NEWLINES_PATTERN, "\n")
    .replace(CARRIAGE_RETURN_PATTERN, "\n");

  if (!CSV_SPECIAL_CHARACTERS_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(DOUBLE_QUOTE_PATTERN, '""')}"`;
}

// Converts receptionist records into a CSV document with one row per receptionist.
function buildReceptionistsCsv(receptionists: AdminReceptionistDto[]): string {
  const rows = [
    RECEPTIONISTS_CSV_HEADERS,
    ...receptionists.map((receptionist) => [
      `${receptionist.firstName} ${receptionist.lastName}`,
      receptionist.username,
      receptionist.email,
      receptionist.phoneNumber ?? "",
      receptionist.createdAt ? formatDate(String(receptionist.createdAt)) : "",
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

// Triggers a browser download for the generated CSV content.
function downloadCsvFile(fileName: string, csvContent: string): void {
  const blob = new Blob(["\uFEFF", csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

// Describes the open state controls for the receptionist details dialog
interface ReceptionistDetailsDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full receptionist profile not visible in the table
function ReceptionistDetailsDialog({
  receptionist,
  open,
  onOpenChange,
}: ReceptionistDetailsDialogProps) {
  if (!receptionist) return null;

  const initials = `${receptionist.firstName[0]}${receptionist.lastName[0]}`;
  const fullAddress = receptionist.address
    ? `${receptionist.address.street}, ${receptionist.address.city}, ${receptionist.address.state} ${receptionist.address.postalCode}, ${receptionist.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar with S3 image or initials fallback */}
            {receptionist.avatarUrl ? (
              <img
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: ACCENT }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {receptionist.firstName} {receptionist.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  @{receptionist.username}
                </span>
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
            <DetailRow label="IC Number" value={receptionist.icNumber} />
            <DetailRow label="Gender" value={genderLabel(receptionist.gender)} />
            <DetailRow
              label="Date of Birth"
              value={receptionist.dateOfBirth ? formatDate(receptionist.dateOfBirth) : "—"}
            />
          </div>

          {/* Contact details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Address
          </p>
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeactivateReceptionistDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirmation dialog before soft-deleting a receptionist account
function DeactivateReceptionistDialog({
  receptionist,
  open,
  onOpenChange,
}: DeactivateReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminDeactivateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist removed successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to remove receptionist");
        }
      },
    },
  });

  if (!receptionist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Remove Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {receptionist.firstName} {receptionist.lastName}
            </span>
            ? Their account will be disabled and they will no longer be able to log in. This action
            cannot be undone from the portal.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <DialogFooter className="px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (receptionist.publicId) {
                mutate({ id: receptionist.publicId.toString() });
              }
            }}
          >
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Admin page displaying a paginated, searchable list of all receptionists
export function AdminReceptionistsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReceptionist, setSelectedReceptionist] = useState<AdminReceptionistDto | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReceptionist, setEditReceptionist] = useState<AdminReceptionistDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deactivateReceptionist, setDeactivateReceptionist] = useState<AdminReceptionistDto | null>(
    null,
  );
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const handleDeactivate = (receptionist: AdminReceptionistDto) => {
    setDeactivateReceptionist(receptionist);
    setDeactivateDialogOpen(true);
  };

  const handleView = (receptionist: AdminReceptionistDto) => {
    setSelectedReceptionist(receptionist);
    setDialogOpen(true);
  };

  const handleEdit = (receptionist: AdminReceptionistDto) => {
    setEditReceptionist(receptionist);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminGetAllReceptionists({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
  });

  const result = data?.status === 200 ? data.data : null;
  const receptionists = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

  const handleExportCsv = () => {
    if (receptionists.length === 0) {
      toast.info("No receptionist records available to export.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    downloadCsvFile(`receptionists-${today}.csv`, buildReceptionistsCsv(receptionists));
    toast.success(
      `Exported ${receptionists.length} receptionist record${receptionists.length === 1 ? "" : "s"}.`,
    );
  };

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
              <BreadcrumbPage>Receptionist Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Receptionist Directory</h1>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5 bg-white text-black hover:bg-muted"
              disabled={isLoading || isError}
              onClick={handleExportCsv}
            >
              <FileDown className="size-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              className="gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="size-4" />
              Add New Receptionist
            </Button>
          </div>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `Total: ${totalCount} personnel currently managed within the system.`}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-muted-foreground tracking-wide">Loading receptionists…</p>
          </div>
        ) : isError ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-sm text-destructive">Failed to load receptionists.</p>
          </div>
        ) : (
          <ReceptionistTable
            data={receptionists}
            page={page}
            totalPages={totalPages}
            hasNextPage={result?.hasNextPage}
            hasPreviousPage={result?.hasPreviousPage}
            onPageChange={setPage}
            search={searchInput}
            onSearchChange={setSearchInput}
            onView={handleView}
            onEdit={handleEdit}
            onDeactivate={handleDeactivate}
          />
        )}
      </motion.div>

      <ReceptionistDetailsDialog
        receptionist={selectedReceptionist}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <EditReceptionistForm
        key={editReceptionist?.publicId}
        receptionist={editReceptionist}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AddNewReceptionistForm open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <DeactivateReceptionistDialog
        key={deactivateReceptionist?.publicId?.toString()}
        receptionist={deactivateReceptionist}
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      />
    </>
  );
}
