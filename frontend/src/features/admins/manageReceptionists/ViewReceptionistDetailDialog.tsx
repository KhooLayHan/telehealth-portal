import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Maps gender code to a readable label.
function genderLabel(code: string | null | undefined): string {
  if (!code) {
    return "N/A";
  }

  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats an API date value for display in the receptionist detail dialog.
function formatDate(value: unknown): string {
  if (!value) {
    return "N/A";
  }

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

// Builds stable initials for the selected receptionist avatar.
function getInitials(receptionist: AdminReceptionistDto): string {
  const firstInitial = receptionist.firstName.trim().at(0) ?? "";
  const lastInitial = receptionist.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "R";
}

// Describes one labelled row inside the receptionist detail dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row rendered inside the receptionist detail dialog.
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

// Shows a muted information panel when optional receptionist details are missing.
function EmptyDetailPanel({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
      {children}
    </p>
  );
}

// Shows the receptionist address in the same compact section style as patient details.
function AddressSection({ receptionist }: { receptionist: AdminReceptionistDto }) {
  if (!receptionist.address) {
    return <EmptyDetailPanel>No address on record.</EmptyDetailPanel>;
  }

  const fullAddress = `${receptionist.address.street}, ${receptionist.address.city}, ${receptionist.address.state} ${receptionist.address.postalCode}, ${receptionist.address.country}`;

  return (
    <>
      <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
          Full Address
        </span>
        <p className="mt-1 text-foreground text-sm">{fullAddress}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <DetailRow label="Street" value={receptionist.address.street} />
        <DetailRow label="City" value={receptionist.address.city} />
        <DetailRow label="State" value={receptionist.address.state} />
        <DetailRow label="Postal Code" value={receptionist.address.postalCode} />
        <DetailRow label="Country" value={receptionist.address.country} />
      </div>
    </>
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
  if (!receptionist) {
    return null;
  }

  const initials = getInitials(receptionist);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            {receptionist.avatarUrl ? (
              <img
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
                className="size-14 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                {receptionist.firstName} {receptionist.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                @{receptionist.username} - {receptionist.phoneNumber || "No phone on record"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(receptionist.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(receptionist.dateOfBirth)} />
            <DetailRow label="Phone" value={receptionist.phoneNumber || "N/A"} />
            <DetailRow label="IC Number" value={receptionist.icNumber || "N/A"} />
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Account Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Username" value={`@${receptionist.username}`} />
            <DetailRow label="Email" value={receptionist.email} />
            <DetailRow label="Slug" value={receptionist.slug} />
            <DetailRow label="Joined" value={formatDate(receptionist.createdAt)} />
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Address
          </p>
          <AddressSection receptionist={receptionist} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
