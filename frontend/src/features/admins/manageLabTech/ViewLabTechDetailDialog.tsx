import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Maps gender code to a readable label.
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a date string as "15 Apr 1982".
function formatDate(iso?: string): string {
  if (!iso) {
    return "-";
  }

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Builds a two-letter fallback for lab technician avatars.
function getLabTechInitials(labTech: AdminLabTechDto): string {
  const initials = `${labTech.firstName[0] ?? ""}${labTech.lastName[0] ?? ""}`.toUpperCase();

  return initials || "LT";
}

// Describes one labelled row inside the lab technician detail dialog.
interface DetailRowProps {
  label: string;
  value: string;
}

// Shows a read-only label and value pair in the lab technician detail dialog.
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <div className="min-h-9 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm text-foreground">
        {value}
      </div>
    </Field>
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
  if (!labTech) {
    return null;
  }

  const initials = getLabTechInitials(labTech);
  const fullName = `${labTech.firstName} ${labTech.lastName}`;
  const fullAddress = labTech.address
    ? `${labTech.address.street}, ${labTech.address.city}, ${labTech.address.state} ${labTech.address.postalCode}, ${labTech.address.country}`
    : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {labTech.avatarUrl ? (
              <img
                src={labTech.avatarUrl}
                alt={fullName}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">{fullName}</DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="font-mono text-xs text-muted-foreground">@{labTech.username}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 px-6 pb-6">
          <TabsList className="mb-5 grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
          </TabsList>

          <TabsContent
            value="personal"
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="First Name" value={labTech.firstName} />
              <DetailRow label="Last Name" value={labTech.lastName} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Gender" value={genderLabel(labTech.gender)} />
              <DetailRow label="Date of Birth" value={formatDate(labTech.dateOfBirth)} />
            </div>
          </TabsContent>

          <TabsContent
            value="account"
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Username" value={`@${labTech.username}`} />
              <DetailRow label="Email" value={labTech.email} />
            </div>

            <DetailRow label="Phone Number" value={labTech.phoneNumber ?? "-"} />
            <DetailRow label="Slug" value={labTech.slug} />
            <DetailRow label="Joined" value={formatDate(labTech.createdAt)} />
          </TabsContent>

          <TabsContent
            value="address"
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
          >
            <DetailRow label="Full Address" value={fullAddress} />

            {labTech.address && (
              <>
                <DetailRow label="Street" value={labTech.address.street} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="City" value={labTech.address.city} />
                  <DetailRow label="State" value={labTech.address.state} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailRow label="Postal Code" value={labTech.address.postalCode} />
                  <DetailRow label="Country" value={labTech.address.country} />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
