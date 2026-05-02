import { AlertCircle, Heart, ShieldAlert } from "lucide-react";

import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Describes the selected patient and dialog state for the patient detail view.
interface ViewPatientDetailDialogProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Describes a labelled detail value shown inside the patient detail dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// Maps allergy severity strings to semantic UI classes.
const SEVERITY_STYLES: Record<string, { icon: string; badge: string }> = {
  high: {
    icon: "text-destructive",
    badge: "bg-destructive text-destructive-foreground",
  },
  low: {
    icon: "text-emerald-600",
    badge: "bg-emerald-600 text-white",
  },
  mild: {
    icon: "text-emerald-600",
    badge: "bg-emerald-600 text-white",
  },
  moderate: {
    icon: "text-amber-600",
    badge: "bg-amber-600 text-white",
  },
  severe: {
    icon: "text-destructive",
    badge: "bg-destructive text-destructive-foreground",
  },
};

// Formats an API date value for display in the patient detail dialog.
function formatDate(value: unknown): string {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Converts the stored gender code into a readable patient label.
function genderLabel(code: string | null): string {
  if (!code) {
    return "N/A";
  }

  const map: Record<string, string> = {
    F: "Female",
    M: "Male",
    N: "Not Specified",
    O: "Other",
  };

  return map[code] ?? code;
}

// Builds stable initials for the selected patient avatar.
function getInitials(patient: ClinicStaffPatientDto): string {
  const firstInitial = patient.firstName.trim().at(0) ?? "";
  const lastInitial = patient.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "P";
}

// A single labelled row rendered inside the patient detail dialog.
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
        {label}
      </span>
      <span className="text-foreground text-sm">{value}</span>
    </div>
  );
}

// Displays the full patient profile information that is not visible in the table.
export function ViewPatientDetailDialog({
  patient,
  open,
  onOpenChange,
}: ViewPatientDetailDialogProps) {
  if (!patient) {
    return null;
  }

  const initials = getInitials(patient);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-semibold text-xl leading-none">
                  {patient.firstName} {patient.lastName}
                </DialogTitle>
                {patient.bloodGroup && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                    <Heart className="size-2.5" />
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-sm">
                {genderLabel(patient.gender)} - {patient.phoneNumber || "No phone on record"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(patient.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            <DetailRow label="Phone" value={patient.phoneNumber || "N/A"} />
            <DetailRow label="IC Number" value={patient.icNumber || "N/A"} />
            <DetailRow label="Blood Group" value={patient.bloodGroup || "N/A"} />
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Allergies
          </p>
          <div className="mb-5 space-y-2">
            {!patient.allergies || patient.allergies.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
                No known allergies.
              </p>
            ) : (
              patient.allergies.map((allergy) => {
                const severityStyle = SEVERITY_STYLES[allergy.severity.toLowerCase()] ?? {
                  icon: "text-muted-foreground",
                  badge: "bg-muted text-muted-foreground",
                };

                return (
                  <div
                    key={`${allergy.allergen}-${allergy.severity}-${allergy.reaction}`}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <AlertCircle className={cn("mt-0.5 size-4 shrink-0", severityStyle.icon)} />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-sm">{allergy.allergen}</p>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 font-semibold text-[10px] uppercase",
                            severityStyle.badge,
                          )}
                        >
                          {allergy.severity}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{allergy.reaction}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Emergency Contact
          </p>
          {patient.emergencyContact ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">{patient.emergencyContact.name}</p>
                <p className="text-muted-foreground text-xs">
                  {patient.emergencyContact.relationship} - {patient.emergencyContact.phone}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
              No emergency contact on record.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
