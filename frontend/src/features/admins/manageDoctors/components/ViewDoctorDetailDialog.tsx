import { GraduationCap, Stethoscope } from "lucide-react";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCENT = "#0d9488";

// Formats an ISO date value for display in the doctor detail dialog.
function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Describes a labelled doctor detail shown in the dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// Displays a compact label and value pair in the doctor detail dialog.
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

// Describes the doctor record and open state for the detail dialog.
interface ViewDoctorDetailDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Displays the selected doctor's full profile information in a dialog.
export function ViewDoctorDetailDialog({
  doctor,
  open,
  onOpenChange,
}: ViewDoctorDetailDialogProps) {
  if (!doctor) return null;

  const initials = `${(doctor.firstName ?? "?")[0]}${(doctor.lastName ?? "?")[0]}`;
  const fullAddress = doctor.address
    ? `${doctor.address.street}, ${doctor.address.city}, ${doctor.address.state} ${doctor.address.postalCode}, ${doctor.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5 shrink-0" />
                  {doctor.specialization ?? ""}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{doctor.licenseNumber ?? ""}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {doctor.bio && (
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {doctor.bio}
            </div>
          )}

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={doctor.gender ?? ""} />
            <DetailRow label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <DetailRow label="Username" value={doctor.username ?? ""} />
          </div>

          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Qualifications
          </p>
          <div className="mb-5 space-y-2">
            {(doctor.qualifications ?? []).map((qualification) => (
              <div
                key={`${qualification.degree}-${qualification.year}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{qualification.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {qualification.institution} · {qualification.year}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
