import { toast } from "sonner";

import { adminGetAllDepartments, useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";

const DEPARTMENTS_CSV_FILE_NAME = "departments.csv";
const DEPARTMENTS_EXPORT_PAGE_SIZE = 50;
const CSV_HEADERS = [
  "Slug",
  "Department Name",
  "Description",
  "Staff Members",
  "Created At",
] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;

// Describes the CSV export controls exposed to the department page.
interface UseDepartmentsCsvExportReturn {
  exportDepartmentsCsv: () => Promise<void>;
  isExportDisabled: boolean;
}

// Formats a date string as "15 Apr 1982".
function formatDate(iso: string | undefined): string {
  if (!iso) {
    return "";
  }

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Escapes one cell so commas, quotes, and line breaks remain valid CSV content.
function escapeCsvCell(value: number | string | null | undefined): string {
  const normalizedValue = String(value ?? "")
    .replace(WINDOWS_NEWLINES_PATTERN, "\n")
    .replace(CARRIAGE_RETURN_PATTERN, "\n");

  if (!CSV_SPECIAL_CHARACTERS_PATTERN.test(normalizedValue)) {
    return normalizedValue;
  }

  return `"${normalizedValue.replace(DOUBLE_QUOTE_PATTERN, '""')}"`;
}

// Converts department records into a CSV document with one row per department.
function buildDepartmentsCsv(departments: AdminDepartmentDto[]): string {
  const rows = [
    CSV_HEADERS,
    ...departments.map((department) => [
      department.slug,
      department.name,
      department.description ?? "",
      department.staffMembers ?? 0,
      formatDate(department.createdAt),
    ]),
  ];

  return `${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

// Triggers a browser download for the generated CSV content.
function downloadCsvFile(fileName: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Fetches every department page from the generated API client and exports it as CSV.
export function useDepartmentsCsvExport(): UseDepartmentsCsvExportReturn {
  const { data, isError, isLoading } = useAdminGetAllDepartments({
    Page: 1,
    PageSize: 1,
  });

  const exportDepartmentsCsv = async () => {
    if (isLoading) {
      toast.info("Departments are still loading.");
      return;
    }

    if (isError || data?.status !== 200) {
      toast.error("Failed to export departments.");
      return;
    }

    const totalCount = Number(data.data.totalCount ?? 0);

    if (totalCount === 0) {
      toast.info("No departments to export.");
      return;
    }

    try {
      const firstPage = await adminGetAllDepartments({
        Page: 1,
        PageSize: DEPARTMENTS_EXPORT_PAGE_SIZE,
      });

      if (firstPage.status !== 200) {
        toast.error("Failed to export departments.");
        return;
      }

      const departments = [...firstPage.data.items];
      const totalPages = Number(firstPage.data.totalPages ?? 1);

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await adminGetAllDepartments({
          Page: page,
          PageSize: DEPARTMENTS_EXPORT_PAGE_SIZE,
        });

        if (pageResponse.status !== 200) {
          toast.error("Failed to export departments.");
          return;
        }

        departments.push(...pageResponse.data.items);
      }

      downloadCsvFile(DEPARTMENTS_CSV_FILE_NAME, buildDepartmentsCsv(departments));
      toast.success("Departments CSV downloaded.");
    } catch {
      toast.error("Failed to export departments.");
    }
  };

  return {
    exportDepartmentsCsv,
    isExportDisabled: isLoading,
  };
}
