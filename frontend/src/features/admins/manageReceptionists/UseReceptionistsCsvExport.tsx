import { useState } from "react";
import { toast } from "sonner";

import { adminGetAllReceptionists } from "@/api/generated/admins/admins";
import type { AdminGetAllReceptionistsParams } from "@/api/model/AdminGetAllReceptionistsParams";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";

const RECEPTIONISTS_CSV_FILE_NAME = "receptionists.csv";
const RECEPTIONISTS_EXPORT_PAGE_SIZE = 100;
const RECEPTIONISTS_CSV_HEADERS = [
  "Public ID",
  "Slug",
  "First Name",
  "Last Name",
  "Full Name",
  "Username",
  "Email",
  "Phone",
  "Gender",
  "Date of Birth",
  "Street",
  "City",
  "State",
  "Postal Code",
  "Country",
  "Joined",
] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Describes the CSV export controls exposed to the receptionist page.
interface UseReceptionistsCsvExportReturn {
  exportReceptionistsCsv: () => Promise<void>;
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

// Maps gender code to a readable label.
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

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

// Converts receptionist records into a CSV document with one row per receptionist.
function buildReceptionistsCsv(receptionists: AdminReceptionistDto[]): string {
  const rows = [
    RECEPTIONISTS_CSV_HEADERS,
    ...receptionists.map((receptionist) => {
      const fullName = `${receptionist.firstName} ${receptionist.lastName}`;
      const address = receptionist.address;

      return [
        receptionist.publicId ?? "",
        receptionist.slug,
        receptionist.firstName,
        receptionist.lastName,
        fullName,
        receptionist.username,
        receptionist.email,
        receptionist.phoneNumber ?? "",
        genderLabel(receptionist.gender),
        formatDate(receptionist.dateOfBirth),
        address?.street ?? "",
        address?.city ?? "",
        address?.state ?? "",
        address?.postalCode ?? "",
        address?.country ?? "",
        formatDate(receptionist.createdAt ? String(receptionist.createdAt) : undefined),
      ];
    }),
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

// Fetches every receptionist page from the generated API client and exports it as CSV.
export function useReceptionistsCsvExport(
  params: Pick<AdminGetAllReceptionistsParams, "Gender" | "Search"> = {},
): UseReceptionistsCsvExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportReceptionistsCsv = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const receptionists: AdminReceptionistDto[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await adminGetAllReceptionists({
          ...params,
          Page: page,
          PageSize: RECEPTIONISTS_EXPORT_PAGE_SIZE,
        });

        if (response.status !== 200) {
          toast.error("Failed to export receptionists.");
          return;
        }

        receptionists.push(...response.data.items);
        hasNextPage = response.data.hasNextPage ?? false;
        page += 1;
      }

      if (receptionists.length === 0) {
        toast.info("No receptionist records available to export.");
        return;
      }

      downloadCsvFile(RECEPTIONISTS_CSV_FILE_NAME, buildReceptionistsCsv(receptionists));
      toast.success("Receptionists CSV downloaded.");
    } catch {
      toast.error("Failed to export receptionists.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportReceptionistsCsv,
    isExportDisabled: isExporting,
  };
}
