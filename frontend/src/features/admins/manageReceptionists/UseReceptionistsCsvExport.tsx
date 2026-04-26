import { toast } from "sonner";

import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";

const RECEPTIONISTS_CSV_HEADERS = [
  "Public ID",
  "Slug",
  "First Name",
  "Last Name",
  "Full Name",
  "Username",
  "Email",
  "Phone",
  "IC Number",
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

// Describes the receptionist records and loading state needed for CSV export.
interface UseReceptionistsCsvExportOptions {
  receptionists: AdminReceptionistDto[];
  isLoading: boolean;
  isError: boolean;
}

// Describes the CSV export controls exposed to the receptionist page.
interface UseReceptionistsCsvExportReturn {
  exportReceptionistsCsv: () => void;
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
        receptionist.icNumber,
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

// Exports the currently loaded receptionist records as CSV.
export function useReceptionistsCsvExport({
  receptionists,
  isLoading,
  isError,
}: UseReceptionistsCsvExportOptions): UseReceptionistsCsvExportReturn {
  const exportReceptionistsCsv = () => {
    if (isLoading) {
      toast.info("Receptionists are still loading.");
      return;
    }

    if (isError) {
      toast.error("Failed to export receptionists.");
      return;
    }

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

  return {
    exportReceptionistsCsv,
    isExportDisabled: isLoading || isError,
  };
}
