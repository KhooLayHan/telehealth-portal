import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAdminGetAllLabTechs } from "@/api/generated/admins/admins";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { LabTechTable } from "@/features/admins/manageLabTech/LabTechTable";

const PAGE_SIZE = 5;

// Displays the admin lab technician directory page header and action controls.
export function AdminLabTechsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminGetAllLabTechs({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
  });

  const result = data?.status === 200 ? data.data : null;
  const labTechs = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

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
            <Button type="button" variant="outline" className="h-9 gap-1.5 bg-background" disabled>
              <FileDown className="size-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              className="h-9 gap-1.5 bg-black text-white hover:bg-black/85"
              disabled
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
            hasNextPage={result?.hasNextPage}
            hasPreviousPage={result?.hasPreviousPage}
            onPageChange={setPage}
            search={searchInput}
            onSearchChange={setSearchInput}
          />
        )}
      </motion.div>
    </div>
  );
}
