import { useAdminGetLabTech } from "@/api/generated/admins/admins";
import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";
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

// Formats an API date value for display in the lab technician detail dialog.
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

// Builds stable initials for the selected lab technician avatar.
function getLabTechInitials(labTech: AdminLabTechDto): string {
  const firstInitial = labTech.firstName.trim().at(0) ?? "";
  const lastInitial = labTech.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "LT";
}

// Describes one labelled row inside the lab technician detail dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row rendered inside the lab technician detail dialog.
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

// Shows a muted information panel when optional lab technician details are missing.
function EmptyDetailPanel({ children }: { children: string }) {
  return (
    <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
      {children}
    </p>
  );
}

// Shows the lab technician address in the same compact section style as patient details.
function AddressSection({ labTech }: { labTech: AdminLabTechDto }) {
  if (!labTech.address) {
    return <EmptyDetailPanel>No address on record.</EmptyDetailPanel>;
  }

  const fullAddress = `${labTech.address.street}, ${labTech.address.city}, ${labTech.address.state} ${labTech.address.postalCode}, ${labTech.address.country}`;

  return (
    <>
      <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <span className="font-semibold text-[10px] text-muted-foreground uppercase tracking-widest">
          Full Address
        </span>
        <p className="mt-1 text-foreground text-sm">{fullAddress}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <DetailRow label="Street" value={labTech.address.street} />
        <DetailRow label="City" value={labTech.address.city} />
        <DetailRow label="State" value={labTech.address.state} />
        <DetailRow label="Postal Code" value={labTech.address.postalCode} />
        <DetailRow label="Country" value={labTech.address.country} />
      </div>
    </>
  );
}

// Describes the open state controls for the lab technician details dialog.
interface ViewLabTechDetailDialogProps {
  labTech: AdminLabTechDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full lab technician profile details not visible in the table.
export function ViewLabTechDetailDialog({
  labTech,
  open,
  onOpenChange,
}: ViewLabTechDetailDialogProps) {
  const labTechId = labTech?.publicId ?? "";
  const { data, isError, isFetching } = useAdminGetLabTech(labTechId, {
    query: {
      enabled: open && !!labTechId,
    },
  });
  const fetchedLabTech = data?.status === 200 ? data.data : null;
  const displayedLabTech = fetchedLabTech ?? labTech;

  if (!displayedLabTech) {
    return null;
  }

  const initials = getLabTechInitials(displayedLabTech);
  const fullName = `${displayedLabTech.firstName} ${displayedLabTech.lastName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            {displayedLabTech.avatarUrl ? (
              <img
                src={displayedLabTech.avatarUrl}
                alt={fullName}
                className="size-14 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">{fullName}</DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                @{displayedLabTech.username} -{" "}
                {displayedLabTech.phoneNumber || "No phone on record"}
              </DialogDescription>
              {(isFetching || isError) && (
                <p className="mt-2 text-muted-foreground text-xs" aria-live="polite">
                  {isFetching
                    ? "Refreshing details..."
                    : "Could not refresh details from the backend."}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(displayedLabTech.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(displayedLabTech.dateOfBirth)} />
            <DetailRow label="Phone" value={displayedLabTech.phoneNumber || "N/A"} />
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Account Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Username" value={`@${displayedLabTech.username}`} />
            <DetailRow label="Email" value={displayedLabTech.email} />
            <DetailRow label="Slug" value={displayedLabTech.slug} />
            <DetailRow label="Joined" value={formatDate(displayedLabTech.createdAt)} />
          </div>

          <p className="mb-3 font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
            Address
          </p>
          <AddressSection labTech={displayedLabTech} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
