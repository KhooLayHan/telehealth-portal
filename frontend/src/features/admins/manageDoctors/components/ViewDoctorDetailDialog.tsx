import { Stethoscope } from "lucide-react";

import type { DoctorListDto } from "@/api/model/DoctorListDto";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const notProvided = "Not provided";

// Formats an ISO date value for display in the doctor detail dialog.
function formatDate(iso: unknown): string {
  if (!iso) {
    return notProvided;
  }

  const date = new Date(String(iso));

  if (Number.isNaN(date.getTime())) {
    return String(iso);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Formats optional doctor values for read-only form fields.
function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return notProvided;
  }

  return String(value);
}

// Formats the doctor's consultation fee for display.
function formatConsultationFee(value: DoctorListDto["consultationFee"]): string {
  if (value === null || value === undefined || value === "") {
    return notProvided;
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-MY", {
    currency: "MYR",
    style: "currency",
  }).format(amount);
}

// Describes a labelled doctor detail shown in the dialog.
interface ReadOnlyFieldProps {
  className?: string;
  label: string;
  value: string;
}

// Displays a read-only value using the same field styling as doctor forms.
function ReadOnlyField({ className, label, value }: ReadOnlyFieldProps) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Input className="bg-muted/30" readOnly value={value} />
    </Field>
  );
}

// Describes a labelled multiline doctor detail shown in the dialog.
interface ReadOnlyTextareaProps {
  label: string;
  value: string;
}

// Displays a read-only multiline value using the same field styling as doctor forms.
function ReadOnlyTextarea({ label, value }: ReadOnlyTextareaProps) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Textarea className="min-h-24 bg-muted/30" readOnly value={value} />
    </Field>
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

  const initials = `${(doctor.firstName ?? "?")[0]}${(doctor.lastName ?? "?")[0]}`.toUpperCase();

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
                  Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
                </DialogTitle>
                {doctor.specialization && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                    <Stethoscope className="size-2.5" />
                    {doctor.specialization}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-sm">
                Review profile details, professional information, address, and qualifications.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="personal" className="flex-1 px-6 pb-2">
          <TabsList className="mb-5 grid h-auto w-full grid-cols-2 rounded-lg border border-border bg-muted/30 p-1 sm:grid-cols-4">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
            <TabsTrigger value="address">Address</TabsTrigger>
            <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          </TabsList>

          <TabsContent
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            value="personal"
          >
            <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
              Personal Information
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="First Name" value={formatValue(doctor.firstName)} />
              <ReadOnlyField label="Last Name" value={formatValue(doctor.lastName)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Username" value={formatValue(doctor.username)} />
              <ReadOnlyField label="Email" value={formatValue(doctor.email)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Phone Number" value={formatValue(doctor.phoneNumber)} />
              <ReadOnlyField label="Gender" value={formatValue(doctor.gender)} />
            </div>
            <ReadOnlyField label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <ReadOnlyTextarea label="Bio" value={formatValue(doctor.bio)} />
          </TabsContent>

          <TabsContent
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            value="professional"
          >
            <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
              Professional Details
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Specialization" value={formatValue(doctor.specialization)} />
              <ReadOnlyField label="Department" value={formatValue(doctor.departmentName)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField
                className="[&_input]:font-mono"
                label="License Number"
                value={formatValue(doctor.licenseNumber)}
              />
              <ReadOnlyField
                className="[&_input]:font-mono"
                label="Consultation Fee (MYR)"
                value={formatConsultationFee(doctor.consultationFee)}
              />
            </div>
          </TabsContent>

          <TabsContent
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            value="address"
          >
            <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
              Address
            </p>
            <ReadOnlyField label="Street" value={formatValue(doctor.address?.street)} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="City" value={formatValue(doctor.address?.city)} />
              <ReadOnlyField label="State" value={formatValue(doctor.address?.state)} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField
                className="[&_input]:font-mono"
                label="Postal Code"
                value={formatValue(doctor.address?.postalCode)}
              />
              <ReadOnlyField label="Country" value={formatValue(doctor.address?.country)} />
            </div>
          </TabsContent>

          <TabsContent
            className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            value="qualifications"
          >
            <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
              Qualifications
            </p>
            <div className="space-y-3">
              {(doctor.qualifications ?? []).map((qualification) => (
                <div
                  className="rounded-lg border border-border bg-muted/30 p-4"
                  key={`${qualification.degree}-${qualification.institution}-${qualification.year}`}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <ReadOnlyField label="Degree" value={formatValue(qualification.degree)} />
                    <ReadOnlyField
                      label="Institution"
                      value={formatValue(qualification.institution)}
                    />
                    <ReadOnlyField
                      className="[&_input]:font-mono"
                      label="Year"
                      value={formatValue(qualification.year)}
                    />
                  </div>
                </div>
              ))}

              {(doctor.qualifications ?? []).length === 0 && (
                <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-muted-foreground text-sm">
                  No qualifications added yet.
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
