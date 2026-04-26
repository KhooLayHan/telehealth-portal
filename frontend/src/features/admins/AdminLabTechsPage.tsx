import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { FileDown, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { type LabTechRecord, LabTechTable } from "@/features/admins/manageLabTech/LabTechTable";

const PAGE_SIZE = 5;

// Temporary lab technician records used until the admin API is connected.
const MOCK_LAB_TECHS = [
  {
    publicId: "e2c7543c-7a89-4d45-92b2-3a83a79bd701",
    firstName: "Aisha",
    lastName: "Tan",
    username: "aisha.tan",
    email: "labtech-001@example.test",
    phoneNumber: "+60 12-555 0148",
    staffId: "LT-1001",
    laboratory: "Haematology",
    status: "Active",
    createdAt: "2025-02-12T08:30:00Z",
    avatarUrl: null,
  },
  {
    publicId: "17fb86f1-d405-4f8d-aea2-8b78393db65f",
    firstName: "Daniel",
    lastName: "Lim",
    username: "daniel.lim",
    email: "labtech-002@example.test",
    phoneNumber: "+60 12-555 0182",
    staffId: "LT-1002",
    laboratory: "Biochemistry",
    status: "Active",
    createdAt: "2024-11-03T09:15:00Z",
    avatarUrl: null,
  },
  {
    publicId: "4014dd31-5ef3-48b5-9ae0-0ade4ac96bbf",
    firstName: "Mei",
    lastName: "Wong",
    username: "mei.wong",
    email: "labtech-003@example.test",
    phoneNumber: "+60 12-555 0206",
    staffId: "LT-1003",
    laboratory: "Microbiology",
    status: "Training",
    createdAt: "2026-01-18T10:45:00Z",
    avatarUrl: null,
  },
  {
    publicId: "9f6ad32d-4ead-4b7f-9ce4-6c25d81d7f2c",
    firstName: "Ravi",
    lastName: "Kumar",
    username: "ravi.kumar",
    email: "labtech-004@example.test",
    phoneNumber: "+60 12-555 0230",
    staffId: "LT-1004",
    laboratory: "Immunology",
    status: "On Leave",
    createdAt: "2024-08-27T07:50:00Z",
    avatarUrl: null,
  },
  {
    publicId: "d34422d1-bd11-4e3b-911d-114bd67131c2",
    firstName: "Nur",
    lastName: "Hassan",
    username: "nur.hassan",
    email: "labtech-005@example.test",
    phoneNumber: "+60 12-555 0264",
    staffId: "LT-1005",
    laboratory: "Pathology",
    status: "Active",
    createdAt: "2025-06-05T12:10:00Z",
    avatarUrl: null,
  },
  {
    publicId: "a9c7061a-e8f6-4680-b441-9d6c8f39cd81",
    firstName: "Grace",
    lastName: "Ong",
    username: "grace.ong",
    email: "labtech-006@example.test",
    phoneNumber: "+60 12-555 0288",
    staffId: "LT-1006",
    laboratory: "Cytology",
    status: "Training",
    createdAt: "2026-03-09T11:20:00Z",
    avatarUrl: null,
  },
] satisfies LabTechRecord[];

// Returns whether a lab technician matches the current search text.
function matchesLabTechSearch(labTech: LabTechRecord, search: string): boolean {
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableText = [
    labTech.firstName,
    labTech.lastName,
    labTech.username,
    labTech.email,
    labTech.staffId,
    labTech.laboratory,
    labTech.status,
    labTech.phoneNumber ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return searchableText.includes(normalizedSearch);
}

// Displays the admin lab technician directory page header and action controls.
export function AdminLabTechsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");

  const filteredLabTechs = useMemo(
    () => MOCK_LAB_TECHS.filter((labTech) => matchesLabTechSearch(labTech, searchInput)),
    [searchInput],
  );

  const totalCount = filteredLabTechs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pageStart = (page - 1) * PAGE_SIZE;
  const labTechs = filteredLabTechs.slice(pageStart, pageStart + PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    setPage(1);
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
        <LabTechTable
          data={labTechs}
          page={page}
          totalCount={totalCount}
          totalPages={totalPages}
          hasNextPage={page < totalPages}
          hasPreviousPage={page > 1}
          onPageChange={setPage}
          search={searchInput}
          onSearchChange={handleSearchChange}
        />
      </motion.div>
    </div>
  );
}
