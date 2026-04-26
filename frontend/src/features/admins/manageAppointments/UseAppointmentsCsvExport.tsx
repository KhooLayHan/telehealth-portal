import { toast } from "sonner";

import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";

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
  "Status Slug",
] as const;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Describes the appointment records and loading state needed for CSV export.
interface UseAppointmentsCsvExportOptions {
  appointments: ReceptionistAppointmentDto[];
  isLoading: boolean;
  isError: boolean;
}

// Describes the CSV export controls exposed to the appointment page.
interface UseAppointmentsCsvExportReturn {
  exportAppointmentsCsv: () => void;
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
      appointment.statusSlug ?? "",
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

// Exports the currently loaded appointment records as CSV.
export function useAppointmentsCsvExport({
  appointments,
  isLoading,
  isError,
}: UseAppointmentsCsvExportOptions): UseAppointmentsCsvExportReturn {
  const exportAppointmentsCsv = () => {
    if (isLoading) {
      toast.info("Appointments are still loading.");
      return;
    }

    if (isError) {
      toast.error("Failed to export appointments.");
      return;
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
  };

  return {
    exportAppointmentsCsv,
    isExportDisabled: isLoading || isError,
  };
}
