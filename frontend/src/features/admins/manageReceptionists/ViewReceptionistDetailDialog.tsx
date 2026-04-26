import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCENT = "#0d9488";

// Maps gender code to a readable label.
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a date string as "15 Apr 1982".
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Describes one labelled row inside the receptionist detail dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// Shows a compact label and value pair in the receptionist detail dialog.
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

// Describes the open state controls for the receptionist details dialog.
interface ViewReceptionistDetailDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full receptionist profile details not visible in the table.
export function ViewReceptionistDetailDialog({
  receptionist,
  open,
  onOpenChange,
}: ViewReceptionistDetailDialogProps) {
  if (!receptionist) return null;

  const initials = `${receptionist.firstName[0]}${receptionist.lastName[0]}`;
  const fullAddress = receptionist.address
    ? `${receptionist.address.street}, ${receptionist.address.city}, ${receptionist.address.state} ${receptionist.address.postalCode}, ${receptionist.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {receptionist.avatarUrl ? (
              <img
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: ACCENT }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {receptionist.firstName} {receptionist.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  @{receptionist.username}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="IC Number" value={receptionist.icNumber} />
            <DetailRow label="Gender" value={genderLabel(receptionist.gender)} />
            <DetailRow
              label="Date of Birth"
              value={receptionist.dateOfBirth ? formatDate(receptionist.dateOfBirth) : "—"}
            />
          </div>

          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Address
          </p>
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
