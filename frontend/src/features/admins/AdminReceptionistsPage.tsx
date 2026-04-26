import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAdminGetAllReceptionists } from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { AddNewReceptionistForm } from "@/features/admins/manageReceptionists/AddNewReceptionistForm";
import { DeleteReceptionistDialog } from "@/features/admins/manageReceptionists/DeleteReceptionistDialog";
import { EditReceptionistForm } from "@/features/admins/manageReceptionists/EditReceptionistForm";
import { ReceptionistTable } from "@/features/admins/manageReceptionists/ReceptionistTable";
import { ViewReceptionistDetailDialog } from "@/features/admins/manageReceptionists/ViewReceptionistDetailDialog";

const PAGE_SIZE = 10;
const RECEPTIONISTS_CSV_HEADERS = ["Name", "Username", "Email", "Phone", "Joined"] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;

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
    <div className="space-y-6">
      <header className="space-y-2">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Receptionist Directory</h1>
            <p className="text-lg text-muted-foreground">
              {isLoading
                ? "Loading..."
                : `Total: ${totalCount} personnel currently managed within the system.`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 bg-background"
              disabled={isLoading || isError}
              onClick={handleExportCsv}
            >
              <FileDown className="size-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              className="h-9 gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="size-4" />
              Add New Receptionist
            </Button>
          </div>
        </div>
      </header>

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

      <ViewReceptionistDetailDialog
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

      <DeleteReceptionistDialog
        key={deactivateReceptionist?.publicId?.toString()}
        receptionist={deactivateReceptionist}
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      />
    </div>
  );
}
