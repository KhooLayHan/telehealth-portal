import { useState } from "react";
import { toast } from "sonner";

import { adminGetAllLabTechs } from "@/api/generated/admins/admins";
import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";

const LAB_TECHS_CSV_FILE_NAME = "lab-technicians.csv";
const LAB_TECHS_EXPORT_PAGE_SIZE = 100;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Defines one exported lab technician CSV column and how its value is read.
interface LabTechCsvColumn {
  header: string;
  getValue: (labTech: AdminLabTechDto) => unknown;
}

// Describes the CSV export controls exposed to the lab technicians page.
interface UseLabTechCsvExportReturn {
  exportLabTechsCsv: () => Promise<void>;
  isExportDisabled: boolean;
}

// Maps gender code to a readable label.
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
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

// Lists the lab technician fields exported by the CSV download.
const LAB_TECH_CSV_COLUMNS: LabTechCsvColumn[] = [
  { header: "Public ID", getValue: (labTech) => labTech.publicId },
  { header: "Slug", getValue: (labTech) => labTech.slug },
  { header: "First Name", getValue: (labTech) => labTech.firstName },
  { header: "Last Name", getValue: (labTech) => labTech.lastName },
  { header: "Full Name", getValue: (labTech) => `${labTech.firstName} ${labTech.lastName}` },
  { header: "Username", getValue: (labTech) => labTech.username },
  { header: "Email", getValue: (labTech) => labTech.email },
  { header: "Phone", getValue: (labTech) => labTech.phoneNumber },
  { header: "Gender", getValue: (labTech) => genderLabel(labTech.gender) },
  { header: "Date of Birth", getValue: (labTech) => formatDate(labTech.dateOfBirth) },
  { header: "Street", getValue: (labTech) => labTech.address?.street },
  { header: "City", getValue: (labTech) => labTech.address?.city },
  { header: "State", getValue: (labTech) => labTech.address?.state },
  { header: "Postal Code", getValue: (labTech) => labTech.address?.postalCode },
  { header: "Country", getValue: (labTech) => labTech.address?.country },
  { header: "Joined", getValue: (labTech) => formatDate(labTech.createdAt) },
];

// Escapes one cell so commas, quotes, line breaks, and formula prefixes remain valid CSV content.
function escapeCsvCell(value: unknown): string {
  const normalizedValue = String(value ?? "")
    .replace(WINDOWS_NEWLINES_PATTERN, "\n")
    .replace(CARRIAGE_RETURN_PATTERN, "\n");
  const safeValue = CSV_FORMULA_PREFIX_PATTERN.test(normalizedValue)
    ? `'${normalizedValue}`
    : normalizedValue;

  if (!CSV_SPECIAL_CHARACTERS_PATTERN.test(safeValue)) {
    return safeValue;
  }

  return `"${safeValue.replace(DOUBLE_QUOTE_PATTERN, '""')}"`;
}

// Converts lab technician records into a CSV document with one row per account.
function buildLabTechsCsv(labTechs: AdminLabTechDto[]): string {
  const rows = [
    LAB_TECH_CSV_COLUMNS.map((column) => column.header),
    ...labTechs.map((labTech) => LAB_TECH_CSV_COLUMNS.map((column) => column.getValue(labTech))),
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

// Fetches every lab technician page from the generated API client and exports it as CSV.
export function useLabTechCsvExport(): UseLabTechCsvExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportLabTechsCsv = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const labTechs: AdminLabTechDto[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await adminGetAllLabTechs({
          Page: page,
          PageSize: LAB_TECHS_EXPORT_PAGE_SIZE,
        });

        if (response.status !== 200) {
          toast.error("Failed to export lab technicians.");
          return;
        }

        labTechs.push(...response.data.items);
        hasNextPage = response.data.hasNextPage ?? false;
        page += 1;
      }

      if (labTechs.length === 0) {
        toast.info("No lab technician records available to export.");
        return;
      }

      downloadCsvFile(LAB_TECHS_CSV_FILE_NAME, buildLabTechsCsv(labTechs));
      toast.success("Lab technicians CSV downloaded.");
    } catch {
      toast.error("Failed to export lab technicians.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportLabTechsCsv,
    isExportDisabled: isExporting,
  };
}
