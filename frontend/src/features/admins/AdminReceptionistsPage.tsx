import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useReceptionistsCsvExport } from "@/features/admins/manageReceptionists/UseReceptionistsCsvExport";
import { ViewReceptionistDetailDialog } from "@/features/admins/manageReceptionists/ViewReceptionistDetailDialog";

const PAGE_SIZE = 10;

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
  const { exportReceptionistsCsv, isExportDisabled } = useReceptionistsCsvExport({
    receptionists,
    isLoading,
    isError,
  });

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
              Manage receptionist accounts and front-desk access across the platform.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 bg-background"
              disabled={isExportDisabled}
              onClick={exportReceptionistsCsv}
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
            totalCount={totalCount}
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
