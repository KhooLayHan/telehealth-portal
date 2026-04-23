import { useForm } from "@tanstack/react-form";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useGetAllPatientsForClinicStaff } from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Teal accent colour shared with the doctors page
const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Maps allergy severity strings to their indicator colours
const SEVERITY_COLORS: Record<string, string> = {
  severe: "#ef4444",
  high: "#ef4444",
  moderate: "#f59e0b",
  medium: "#f59e0b",
  low: "#22c55e",
  mild: "#22c55e",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// Formats an ISO date string as "15 Apr 1992"
function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Returns a human-readable gender label from the single-character code
function genderLabel(code: string | null): string {
  if (!code) return "—";
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not Specified" };
  return map[code] ?? code;
}

// ── Detail row ─────────────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row rendered inside the patient detail dialog
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

// ── Patient details dialog ─────────────────────────────────────────────────────

interface PatientDetailsDialogProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal that displays the full patient profile not visible in the table
function PatientDetailsDialog({ patient, open, onOpenChange }: PatientDetailsDialogProps) {
  if (!patient) return null;

  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Accent top bar */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar / initials */}
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {patient.firstName} {patient.lastName}
                </DialogTitle>
                {patient.bloodGroup && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold"
                    style={{
                      borderColor: ACCENT,
                      color: ACCENT,
                      backgroundColor: `${ACCENT}12`,
                    }}
                  >
                    <Heart className="size-2.5" />
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-sm">
                {genderLabel(patient.gender)} · {patient.phoneNumber || "No phone on record"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={genderLabel(patient.gender)} />
            <DetailRow label="Date of Birth" value={formatDate(patient.dateOfBirth)} />
            <DetailRow label="Phone" value={patient.phoneNumber || "—"} />
            <DetailRow label="Blood Group" value={patient.bloodGroup || "—"} />
          </div>

          {/* Allergies */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Allergies
          </p>
          <div className="mb-5 space-y-2">
            {!patient.allergies || patient.allergies.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                No known allergies.
              </p>
            ) : (
              patient.allergies.map((allergy) => (
                <div
                  key={`${allergy.allergen}-${allergy.severity}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    style={{ color: SEVERITY_COLORS[allergy.severity] ?? "#6b7280" }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{allergy.allergen}</p>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white"
                        style={{
                          backgroundColor: SEVERITY_COLORS[allergy.severity] ?? "#6b7280",
                        }}
                      >
                        {allergy.severity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{allergy.reaction}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Emergency contact */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Emergency Contact
          </p>
          {patient.emergencyContact ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
              <ShieldAlert className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{patient.emergencyContact.name}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.emergencyContact.relationship} · {patient.emergencyContact.phone}
                </p>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              No emergency contact on record.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit patient dialog ────────────────────────────────────────────────────────

// Blood group options presented in the select
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

// Zod schema for a single allergy entry
const allergySchema = z.object({
  allergen: z.string().min(1, "Allergen is required"),
  severity: z.string().min(1, "Severity is required"),
  reaction: z.string().min(1, "Reaction is required"),
});

// Zod schema for the complete edit-patient form
const editPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  phoneNumber: z.string(),
  bloodGroup: z.string(),
  gender: z.string(),
  allergies: z.array(allergySchema),
  emergencyContactName: z.string(),
  emergencyContactRelationship: z.string(),
  emergencyContactPhone: z.string(),
});

// Shape of values produced by a successful form submission
export type EditPatientFormValues = z.infer<typeof editPatientSchema>;

interface EditPatientDialogProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: EditPatientFormValues) => void;
}

// Guard that prevents the inner form from mounting until a patient is selected
function EditPatientDialog({ patient, open, onOpenChange, onSave }: EditPatientDialogProps) {
  if (!patient) return null;
  return (
    <EditPatientForm patient={patient} open={open} onOpenChange={onOpenChange} onSave={onSave} />
  );
}

interface EditPatientFormProps {
  patient: ClinicStaffPatientDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: EditPatientFormValues) => void;
}

// Inner form — keeps the TanStack Form instance alive for a single patient
function EditPatientForm({ patient, open, onOpenChange, onSave }: EditPatientFormProps) {
  const initials = `${patient.firstName[0]}${patient.lastName[0]}`;

  // Stable UUID keys so allergy rows keep their identity when items are added / removed
  const allergyKeysRef = useRef<string[]>((patient.allergies ?? []).map(() => crypto.randomUUID()));

  const form = useForm({
    defaultValues: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      dateOfBirth: String(patient.dateOfBirth),
      phoneNumber: patient.phoneNumber ?? "",
      bloodGroup: patient.bloodGroup ?? "",
      gender: patient.gender ?? "",
      allergies: (patient.allergies ?? []).map((a) => ({
        allergen: a.allergen,
        severity: a.severity,
        reaction: a.reaction,
      })),
      emergencyContactName: patient.emergencyContact?.name ?? "",
      emergencyContactRelationship: patient.emergencyContact?.relationship ?? "",
      emergencyContactPhone: patient.emergencyContact?.phone ?? "",
    } satisfies EditPatientFormValues,
    validators: { onSubmit: editPatientSchema },
    onSubmit: async ({ value }) => {
      onSave?.(value);
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Accent top bar */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar initials */}
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-none">
                Edit {patient.firstName} {patient.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Update patient profile details. Changes are front-end only — not yet connected to
                the backend.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col"
        >
          <Tabs defaultValue="personal" className="flex-1 px-6 pb-2">
            <TabsList className="mb-5 grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="emergency">Emergency Contact</TabsTrigger>
            </TabsList>

            {/* ── Personal Info ─────────────────────────────────────────── */}
            <TabsContent
              value="personal"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>First Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Last Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="dateOfBirth">
                  {(field) => (
                    <Field>
                      <FieldLabel>Date of Birth</FieldLabel>
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+601x-xxxxxxx"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Blood group select */}
                <form.Field name="bloodGroup">
                  {(field) => (
                    <Field>
                      <FieldLabel>Blood Group</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bg) => (
                            <SelectItem key={bg} value={bg}>
                              {bg}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                {/* Gender select */}
                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel>Gender</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                          <SelectItem value="N">Not Specified</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            {/* ── Allergies ─────────────────────────────────────────────── */}
            <TabsContent value="allergies" className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1">
              <form.Field name="allergies" mode="array">
                {(field) => (
                  <div className="space-y-3">
                    {field.state.value.map((_, i) => (
                      <div
                        key={allergyKeysRef.current[i]}
                        className="relative rounded-lg border border-border bg-muted/30 p-4"
                      >
                        {/* Remove button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Remove allergy"
                          onClick={() => {
                            allergyKeysRef.current.splice(i, 1);
                            field.removeValue(i);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="grid grid-cols-3 gap-3">
                          <form.Field name={`allergies[${i}].allergen`}>
                            {(allergenField) => (
                              <Field>
                                <FieldLabel>Allergen</FieldLabel>
                                <Input
                                  value={allergenField.state.value}
                                  onChange={(e) => allergenField.handleChange(e.target.value)}
                                  onBlur={allergenField.handleBlur}
                                  placeholder="e.g. Penicillin"
                                />
                                <FieldError
                                  errors={
                                    allergenField.state.meta.errors as Array<{
                                      message?: string;
                                    }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`allergies[${i}].severity`}>
                            {(severityField) => (
                              <Field>
                                <FieldLabel>Severity</FieldLabel>
                                <Select
                                  value={severityField.state.value}
                                  onValueChange={(v) => severityField.handleChange(v ?? "")}
                                >
                                  <SelectTrigger
                                    className="w-full"
                                    onBlur={severityField.handleBlur}
                                  >
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mild">Mild</SelectItem>
                                    <SelectItem value="moderate">Moderate</SelectItem>
                                    <SelectItem value="severe">Severe</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FieldError
                                  errors={
                                    severityField.state.meta.errors as Array<{
                                      message?: string;
                                    }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`allergies[${i}].reaction`}>
                            {(reactionField) => (
                              <Field>
                                <FieldLabel>Reaction</FieldLabel>
                                <Input
                                  value={reactionField.state.value}
                                  onChange={(e) => reactionField.handleChange(e.target.value)}
                                  onBlur={reactionField.handleBlur}
                                  placeholder="e.g. Rash, swelling"
                                />
                                <FieldError
                                  errors={
                                    reactionField.state.meta.errors as Array<{
                                      message?: string;
                                    }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}

                    {field.state.value.length === 0 && (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No allergies recorded. Add one below.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        allergyKeysRef.current.push(crypto.randomUUID());
                        field.pushValue({ allergen: "", severity: "mild", reaction: "" });
                      }}
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Add Allergy
                    </Button>
                  </div>
                )}
              </form.Field>
            </TabsContent>

            {/* ── Emergency Contact ─────────────────────────────────────── */}
            <TabsContent
              value="emergency"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="emergencyContactName">
                {(field) => (
                  <Field>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Jane Doe"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="emergencyContactRelationship">
                  {(field) => (
                    <Field>
                      <FieldLabel>Relationship</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Spouse, Parent"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="emergencyContactPhone">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+601x-xxxxxxx"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  style={{ background: ACCENT }}
                >
                  {isSubmitting ? "Saving…" : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Table column definitions ───────────────────────────────────────────────────

// Column definitions for the patient records data table
const columns: ColumnDef<ClinicStaffPatientDto>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.firstName} {row.original.lastName}
      </span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue<string>("phoneNumber") || "—"}</span>
    ),
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("dateOfBirth"))}</span>,
  },
  {
    accessorKey: "gender",
    header: "Gender",
    cell: ({ row }) => (
      <span className="text-xs">{genderLabel(row.getValue<string | null>("gender"))}</span>
    ),
  },
  {
    accessorKey: "joinedAt",
    header: "Joined At",
    cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("joinedAt"))}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onView: (p: ClinicStaffPatientDto) => void;
        onEdit: (p: ClinicStaffPatientDto) => void;
        onRemove: (p: ClinicStaffPatientDto) => void;
      };
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="View patient details"
            onClick={() => meta.onView(row.original)}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Edit patient"
            onClick={() => meta.onEdit(row.original)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Remove patient record"
            onClick={() => meta.onRemove(row.original)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      );
    },
  },
];

// ── Data table component ───────────────────────────────────────────────────────

interface DataTableProps {
  data: ClinicStaffPatientDto[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (patient: ClinicStaffPatientDto) => void;
  onEdit: (patient: ClinicStaffPatientDto) => void;
  onRemove: (patient: ClinicStaffPatientDto) => void;
}

// Renders the paginated, searchable patient records table
function DataTable({
  data,
  isLoading,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onView,
  onEdit,
  onRemove,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView, onEdit, onRemove },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-4">
        <div className="relative w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-foreground/20 bg-foreground hover:bg-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading patients…" : "No patients found."}
                  </p>
                  {!isLoading && (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Try adjusting your search.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push(`ellipsis-after-${arr[idx - 1]}`);
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-1 text-xs text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    style={item === page ? { background: ACCENT } : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────────

// Admin page for viewing all registered patient user records
export function AdminPatientsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editPatient, setEditPatient] = useState<ClinicStaffPatientDto | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Debounce the search input by 400 ms and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch patients from the backend with server-side search and pagination
  const { data, isLoading } = useGetAllPatientsForClinicStaff({
    Search: search.trim() || undefined,
    Page: page,
    PageSize: PAGE_SIZE,
  });

  const pagedResult = data?.status === 200 ? data.data : null;
  const patients = pagedResult?.items ?? [];
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const handleView = (patient: ClinicStaffPatientDto) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleEdit = (patient: ClinicStaffPatientDto) => {
    setEditPatient(patient);
    setEditOpen(true);
  };

  const handleRemove = (patient: ClinicStaffPatientDto) => {
    setSelectedPatient(patient);
  };

  return (
    <>
      {/* Page card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          {/* Accent top line */}
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="flex items-end justify-between px-6 pb-4 pt-6">
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Patients
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">
                Patient Records
              </h1>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{totalCount}</span>{" "}
              {totalCount === 1 ? "patient" : "patients"} found
            </p>
          </div>

          <Separator />

          <div className="p-6">
            <DataTable
              data={patients}
              isLoading={isLoading}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={searchInput}
              onSearchChange={setSearchInput}
              onView={handleView}
              onEdit={handleEdit}
              onRemove={handleRemove}
            />
          </div>
        </div>
      </motion.div>

      {/* Patient details dialog */}
      <PatientDetailsDialog
        patient={selectedPatient}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {/* Edit patient dialog */}
      <EditPatientDialog patient={editPatient} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
