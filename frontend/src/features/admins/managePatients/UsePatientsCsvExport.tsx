import { useState } from "react";
import { toast } from "sonner";

import { getAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";

const PATIENTS_CSV_FILE_NAME = "patients.csv";
const PATIENTS_EXPORT_PAGE_SIZE = 100;
const CSV_SPECIAL_CHARACTERS_PATTERN = /[",\n]/;
const WINDOWS_NEWLINES_PATTERN = /\r\n/g;
const CARRIAGE_RETURN_PATTERN = /\r/g;
const DOUBLE_QUOTE_PATTERN = /"/g;
const CSV_FORMULA_PREFIX_PATTERN = /^\s*[=+\-@]/;

// Defines one exported patient CSV column and how its value is read.
interface PatientCsvColumn {
  header: string;
  getValue: (patient: ClinicStaffPatientDto) => unknown;
}

// Describes the CSV export controls exposed to the patients page.
interface UsePatientsCsvExportReturn {
  exportPatientsCsv: () => Promise<void>;
  isExportDisabled: boolean;
}

// Lists the patient fields exported by the CSV download.
const PATIENT_CSV_COLUMNS: PatientCsvColumn[] = [
  { header: "Patient Public ID", getValue: (patient) => patient.patientPublicId },
  { header: "Slug", getValue: (patient) => patient.slug },
  { header: "Full Name", getValue: (patient) => patient.fullName },
  { header: "First Name", getValue: (patient) => patient.firstName },
  { header: "Last Name", getValue: (patient) => patient.lastName },
  { header: "Date of Birth", getValue: (patient) => patient.dateOfBirth },
  { header: "Phone Number", getValue: (patient) => patient.phoneNumber },
  { header: "Blood Group", getValue: (patient) => patient.bloodGroup },
  { header: "Gender", getValue: (patient) => patient.gender },
  {
    header: "Allergies",
    getValue: (patient) =>
      (patient.allergies ?? [])
        .map((allergy) => `${allergy.allergen} (${allergy.severity}: ${allergy.reaction})`)
        .join("; "),
  },
  {
    header: "Emergency Contact Name",
    getValue: (patient) => patient.emergencyContact?.name,
  },
  {
    header: "Emergency Contact Relationship",
    getValue: (patient) => patient.emergencyContact?.relationship,
  },
  {
    header: "Emergency Contact Phone",
    getValue: (patient) => patient.emergencyContact?.phone,
  },
  { header: "Joined At", getValue: (patient) => patient.joinedAt },
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

// Converts patient records into a CSV document with one row per patient.
function buildPatientsCsv(patients: ClinicStaffPatientDto[]): string {
  const rows = [
    PATIENT_CSV_COLUMNS.map((column) => column.header),
    ...patients.map((patient) => PATIENT_CSV_COLUMNS.map((column) => column.getValue(patient))),
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

// Fetches patient pages from the generated API client and exports them as CSV.
export function usePatientsCsvExport(): UsePatientsCsvExportReturn {
  const [isExporting, setIsExporting] = useState(false);

  const exportPatientsCsv = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const patients: ClinicStaffPatientDto[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await getAllPatientsForClinicStaff({
          Page: page,
          PageSize: PATIENTS_EXPORT_PAGE_SIZE,
        });

        if (response.status !== 200) {
          toast.error("Failed to export patients.");
          return;
        }

        patients.push(...response.data.items);
        hasNextPage = response.data.hasNextPage ?? false;
        page += 1;
      }

      if (patients.length === 0) {
        toast.info("No patient records available to export.");
        return;
      }

      downloadCsvFile(PATIENTS_CSV_FILE_NAME, buildPatientsCsv(patients));
      toast.success("Patients CSV downloaded.");
    } catch {
      toast.error("Failed to export patients.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportPatientsCsv,
    isExportDisabled: isExporting,
  };
}
