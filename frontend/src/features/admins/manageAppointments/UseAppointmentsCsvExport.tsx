import { useState } from "react";
import { toast } from "sonner";

import { getAllAppointmentsForReceptionist } from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";

const APPOINTMENTS_EXPORT_PAGE_SIZE = 50;
const APPOINTMENTS_CSV_HEADERS = [
  "Public ID",
  "Slug",
  "Date",
  "Start Time",
  "End Time",
  "Patient",
  "Doctor",
  "Specialization",
  "Visit Reason",
  "Status",
] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Describes the CSV export controls exposed to the appointment page.
interface UseAppointmentsCsvExportReturn {
  exportAppointmentsCsv: () => Promise<void>;
  isExportDisabled: boolean;
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

// Converts appointment records into a CSV document with one row per appointment.
function buildAppointmentsCsv(appointments: ReceptionistAppointmentDto[]): string {
  const rows = [
    APPOINTMENTS_CSV_HEADERS,
    ...appointments.map((appointment) => [
      appointment.publicId ?? "",
      appointment.slug,
      appointment.date ?? "",
      appointment.startTime ?? "",
      appointment.endTime ?? "",
      appointment.patientName ?? "",
      appointment.doctorName ?? "",
      appointment.specialization ?? "",
      appointment.visitReason,
      appointment.status ?? "",
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

// Fetches all appointment pages from the generated API client and exports them as CSV.
export function useAppointmentsCsvExport(): UseAppointmentsCsvExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportAppointmentsCsv = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const appointments: ReceptionistAppointmentDto[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await getAllAppointmentsForReceptionist({
          Page: page,
          PageSize: APPOINTMENTS_EXPORT_PAGE_SIZE,
          SortOrder: "asc",
        });

        if (response.status !== 200) {
          toast.error("Failed to export appointments.");
          return;
        }

        appointments.push(...response.data.items);
        hasNextPage = response.data.hasNextPage ?? false;
        page += 1;
      }

      if (appointments.length === 0) {
        toast.info("No appointment records available to export.");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      downloadCsvFile(`appointments-${today}.csv`, buildAppointmentsCsv(appointments));
      toast.success(
        `Exported ${appointments.length} appointment record${appointments.length === 1 ? "" : "s"}.`,
      );
    } catch {
      toast.error("Failed to export appointments.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportAppointmentsCsv,
    isExportDisabled: isExporting,
  };
}
