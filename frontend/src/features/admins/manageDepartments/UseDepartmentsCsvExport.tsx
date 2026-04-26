import { toast } from "sonner";

import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";

const DEPARTMENTS_CSV_FILE_NAME = "departments.csv";
const CSV_HEADERS = ["Slug", "Department Name", "Description", "Staff Members"] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;

// Describes the CSV export controls exposed to the department page.
interface UseDepartmentsCsvExportReturn {
  exportDepartmentsCsv: () => void;
  isExportDisabled: boolean;
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

// Fetches all departments from the cached admin query and exports them as CSV.
export function useDepartmentsCsvExport(): UseDepartmentsCsvExportReturn {
  const { data, isError, isLoading } = useAdminGetAllDepartments();

  const exportDepartmentsCsv = () => {
    if (isLoading) {
      toast.info("Departments are still loading.");
      return;
    }

    if (isError || data?.status !== 200) {
      toast.error("Failed to export departments.");
      return;
    }

    downloadCsvFile(DEPARTMENTS_CSV_FILE_NAME, buildDepartmentsCsv(data.data));
    toast.success("Departments CSV downloaded.");
  };

  return {
    exportDepartmentsCsv,
    isExportDisabled: isLoading,
  };
}
