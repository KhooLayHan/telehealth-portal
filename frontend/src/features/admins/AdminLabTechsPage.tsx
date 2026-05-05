import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Filter, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminGetAllLabTechs } from "@/api/generated/admins/admins";
import type { AdminGetAllLabTechsParams } from "@/api/model/AdminGetAllLabTechsParams";
import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";
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
import { AddNewLabTechForm } from "@/features/admins/manageLabTech/AddNewLabTechForm";
import { DeleteLabTechDialog } from "@/features/admins/manageLabTech/DeleteLabTechDialog";
import { EditLabTechForm } from "@/features/admins/manageLabTech/EditLabTechForm";
import { LabTechTable } from "@/features/admins/manageLabTech/LabTechTable";
import { useLabTechCsvExport } from "@/features/admins/manageLabTech/UseLabTechCsvExport";
import { ViewLabTechDetailDialog } from "@/features/admins/manageLabTech/ViewLabTechDetailDialog";

const PAGE_SIZE = 5;
const LAB_TECHS_REFETCH_INTERVAL_MS = 1000;

// Lists the lab technician gender filters supported by the admin lab technician endpoint.
const GENDER_FILTER_OPTIONS = [
  { label: "Male", value: "M" },
  { label: "Female", value: "F" },
  { label: "Other", value: "O" },
  { label: "Not specified", value: "N" },
] as const;

// Displays the admin lab technician directory page header and action controls.
export function AdminLabTechsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedLabTech, setSelectedLabTech] = useState<AdminLabTechDto | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editLabTech, setEditLabTech] = useState<AdminLabTechDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteLabTech, setDeleteLabTech] = useState<AdminLabTechDto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { exportLabTechsCsv, isExportDisabled } = useLabTechCsvExport();
  const activeFilterCount = Number(Boolean(genderFilter));

  const handleView = (labTech: AdminLabTechDto) => {
    setSelectedLabTech(labTech);
    setViewDialogOpen(true);
  };

  const handleEdit = (labTech: AdminLabTechDto) => {
    setEditLabTech(labTech);
    setEditDialogOpen(true);
  };

  const handleDelete = (labTech: AdminLabTechDto) => {
    setDeleteLabTech(labTech);
    setDeleteDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const labTechListParams: AdminGetAllLabTechsParams & { Gender?: string } = {
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search.trim() || undefined,
    Gender: genderFilter || undefined,
  };

  const { data, isLoading, isError } = useAdminGetAllLabTechs(labTechListParams, {
    query: {
      refetchInterval: LAB_TECHS_REFETCH_INTERVAL_MS,
    },
  });

  const result = data?.status === 200 ? data.data : null;
  const labTechs = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

  return (
    <div className="space-y-6">
      <header className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lab Technician Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Lab Technician Directory</h1>
            <p className="text-lg text-muted-foreground">
              Manage lab technician accounts and laboratory access across the platform.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 bg-background"
              disabled={isExportDisabled}
              onClick={() => void exportLabTechsCsv()}
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
              Add New Lab Tech
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
            <p className="text-muted-foreground text-sm tracking-wide">
              Loading lab technicians...
            </p>
          </div>
        ) : isError ? (
          <div className="flex h-48 items-center justify-center">
            <p className="text-destructive text-sm">Failed to load lab technicians.</p>
          </div>
        ) : (
          <LabTechTable
            data={labTechs}
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
                      aria-label="Filter lab technicians"
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
                    <PopoverTitle>Lab technician filters</PopoverTitle>
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
            onView={handleView}
            onEdit={handleEdit}
            onDeactivate={handleDelete}
          />
        )}
      </motion.div>

      <AddNewLabTechForm open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <ViewLabTechDetailDialog
        labTech={selectedLabTech}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />

      <EditLabTechForm
        key={editLabTech?.publicId}
        labTech={editLabTech}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteLabTechDialog
        key={deleteLabTech?.publicId?.toString()}
        labTech={deleteLabTech}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
