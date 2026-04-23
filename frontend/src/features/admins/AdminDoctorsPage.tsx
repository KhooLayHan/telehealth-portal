import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GraduationCap,
  Pencil,
  Plus,
  Search,
  Stethoscope,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getGetAllQueryKey,
  useCreateDoctor,
  useDeleteDoctorById,
  useGetAll,
  useUpdateDoctorById,
} from "@/api/generated/doctors/doctors";
import type { CreateDoctorCommand } from "@/api/model/CreateDoctorCommand";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import type { UpdateDoctorCommand } from "@/api/model/UpdateDoctorCommand";
import { ApiError } from "@/api/ofetch-mutator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Textarea } from "@/components/ui/textarea";

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Zod schema that validates every field in the edit-doctor dialog form
const editDoctorSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z.string(),
  gender: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  bio: z.string(),
  specialization: z.string().min(1, "Required"),
  licenseNumber: z.string().min(1, "Required"),
  consultationFee: z.number().nonnegative("Must be ≥ 0").nullable(),
  departmentName: z.string().min(1, "Required"),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressPostalCode: z.string(),
  addressCountry: z.string(),
  qualifications: z.array(
    z.object({
      degree: z.string().min(1, "Required"),
      institution: z.string().min(1, "Required"),
      year: z.number().int().min(1900, "Min 1900").max(2100, "Max 2100"),
    }),
  ),
});

// Converts a DoctorListDto into the flat default-values shape used by the edit form
function buildEditDefaultValues(doctor: DoctorListDto) {
  return {
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    username: doctor.username,
    email: doctor.email,
    phoneNumber: doctor.phoneNumber ?? "",
    gender: doctor.gender,
    dateOfBirth: String(doctor.dateOfBirth),
    bio: doctor.bio ?? "",
    specialization: doctor.specialization,
    licenseNumber: doctor.licenseNumber,
    consultationFee: doctor.consultationFee,
    departmentName: doctor.departmentName,
    addressStreet: doctor.address?.street ?? "",
    addressCity: doctor.address?.city ?? "",
    addressState: doctor.address?.state ?? "",
    addressPostalCode: doctor.address?.postalCode ?? "",
    addressCountry: doctor.address?.country ?? "",
    qualifications: doctor.qualifications.map((q) => ({
      degree: q.degree,
      institution: q.institution,
      year: q.year,
    })),
  };
}

// Formats a date string or NodaTime Instant as "15 Apr 1982"
function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row inside the detail dialog
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

interface DoctorDetailsDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full doctor profile not visible in the table
function DoctorDetailsDialog({ doctor, open, onOpenChange }: DoctorDetailsDialogProps) {
  if (!doctor) return null;

  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;
  const fullAddress = doctor.address
    ? `${doctor.address.street}, ${doctor.address.city}, ${doctor.address.state} ${doctor.address.postalCode}, ${doctor.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header band with accent colour */}
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
                  Dr. {doctor.firstName} {doctor.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Stethoscope className="size-3.5 shrink-0" />
                  {doctor.specialization}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-mono text-xs">{doctor.licenseNumber}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Bio */}
          {doctor.bio && (
            <div className="mb-5 rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed text-foreground/80">
              {doctor.bio}
            </div>
          )}

          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Gender" value={doctor.gender} />
            <DetailRow label="Date of Birth" value={formatDate(doctor.dateOfBirth)} />
            <DetailRow label="Username" value={doctor.username} />
          </div>

          {/* Address */}
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>

          {/* Qualifications */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Qualifications
          </p>
          <div className="mb-5 space-y-2">
            {doctor.qualifications.map((q) => (
              <div
                key={`${q.degree}-${q.year}`}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3"
              >
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{q.degree}</p>
                  <p className="text-xs text-muted-foreground">
                    {q.institution} · {q.year}
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

interface EditDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Guard that prevents the inner form from mounting until a doctor is selected
function EditDoctorDialog({ doctor, open, onOpenChange }: EditDoctorDialogProps) {
  if (!doctor) return null;
  return <EditDoctorForm doctor={doctor} open={open} onOpenChange={onOpenChange} />;
}

// Inner form component; keeps the TanStack Form instance alive for a single doctor
function EditDoctorForm({
  doctor,
  open,
  onOpenChange,
}: {
  doctor: DoctorListDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useUpdateDoctorById();
  const initials = `${doctor.firstName[0]}${doctor.lastName[0]}`;

  // Stable UUID keys so qualification rows keep their identity when items are added/removed
  const qualKeysRef = useRef<string[]>(doctor.qualifications.map(() => crypto.randomUUID()));

  const form = useForm({
    defaultValues: buildEditDefaultValues(doctor),
    validators: { onSubmit: editDoctorSchema },
    onSubmit: async ({ value }) => {
      const payload: UpdateDoctorCommand = {
        firstName: value.firstName,
        lastName: value.lastName,
        username: value.username,
        email: value.email,
        phoneNumber: value.phoneNumber || null,
        gender: value.gender[0] ?? "N",
        dateOfBirth: value.dateOfBirth,
        bio: value.bio || null,
        specialization: value.specialization,
        licenseNumber: value.licenseNumber,
        consultationFee: value.consultationFee,
        departmentName: value.departmentName,
        address: value.addressStreet
          ? {
              street: value.addressStreet,
              city: value.addressCity,
              state: value.addressState,
              postalCode: value.addressPostalCode,
              country: value.addressCountry,
            }
          : null,
        qualifications: value.qualifications.map((q) => ({
          degree: q.degree,
          institution: q.institution,
          year: q.year,
        })),
      };

      try {
        await mutateAsync({ id: String(doctor.doctorPublicId), data: payload });
        toast.success(`Dr. ${doctor.firstName} ${doctor.lastName}'s profile updated.`);
        await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
        onOpenChange(false);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data?.title ?? "Failed to update doctor.");
        } else {
          toast.error("Failed to update doctor.");
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Accent bar */}
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
              <DialogTitle className="text-xl font-semibold leading-none">
                Edit Dr. {doctor.firstName} {doctor.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Update profile details. Changes are front-end only — not yet connected to the
                backend.
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
            <TabsList className="mb-5 grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
            </TabsList>

            {/* ── Personal ─────────────────────────────────────────────── */}
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
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
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
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

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

              {/* Bio textarea */}
              <form.Field name="bio">
                {(field) => (
                  <Field>
                    <FieldLabel>Bio</FieldLabel>
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      rows={3}
                      placeholder="Brief professional bio…"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            {/* ── Professional ─────────────────────────────────────────── */}
            <TabsContent
              value="professional"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="specialization">
                  {(field) => (
                    <Field>
                      <FieldLabel>Specialization</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="departmentName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Department</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology Department"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="licenseNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>License Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. MMC12345"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                {/* Consultation fee — nullable number */}
                <form.Field name="consultationFee">
                  {(field) => (
                    <Field>
                      <FieldLabel>Consultation Fee (MYR)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        placeholder="e.g. 150.00"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            {/* ── Address ──────────────────────────────────────────────── */}
            <TabsContent
              value="address"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="addressStreet">
                {(field) => (
                  <Field>
                    <FieldLabel>Street</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 123 Jalan Ampang"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="addressCity">
                  {(field) => (
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Kuala Lumpur"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="addressState">
                  {(field) => (
                    <Field>
                      <FieldLabel>State</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Wilayah Persekutuan"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="addressPostalCode">
                  {(field) => (
                    <Field>
                      <FieldLabel>Postal Code</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. 50450"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="addressCountry">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Malaysia"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            {/* ── Qualifications ───────────────────────────────────────── */}
            <TabsContent
              value="qualifications"
              className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="qualifications" mode="array">
                {(field) => (
                  <div className="space-y-3">
                    {field.state.value.map((_, i) => (
                      <div
                        key={qualKeysRef.current[i]}
                        className="relative rounded-lg border border-border bg-muted/30 p-4"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Remove qualification"
                          onClick={() => {
                            qualKeysRef.current.splice(i, 1);
                            field.removeValue(i);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="grid grid-cols-3 gap-3">
                          <form.Field name={`qualifications[${i}].degree`}>
                            {(degreeField) => (
                              <Field>
                                <FieldLabel>Degree</FieldLabel>
                                <Input
                                  value={degreeField.state.value}
                                  onChange={(e) => degreeField.handleChange(e.target.value)}
                                  onBlur={degreeField.handleBlur}
                                  placeholder="e.g. MBBS"
                                />
                                <FieldError
                                  errors={
                                    degreeField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].institution`}>
                            {(instField) => (
                              <Field>
                                <FieldLabel>Institution</FieldLabel>
                                <Input
                                  value={instField.state.value}
                                  onChange={(e) => instField.handleChange(e.target.value)}
                                  onBlur={instField.handleBlur}
                                  placeholder="e.g. University of Malaya"
                                />
                                <FieldError
                                  errors={
                                    instField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].year`}>
                            {(yearField) => (
                              <Field>
                                <FieldLabel>Year</FieldLabel>
                                <Input
                                  type="number"
                                  value={yearField.state.value}
                                  onChange={(e) => yearField.handleChange(Number(e.target.value))}
                                  onBlur={yearField.handleBlur}
                                  placeholder="e.g. 2010"
                                  className="font-mono"
                                />
                                <FieldError
                                  errors={
                                    yearField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}

                    {field.state.value.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No qualifications added yet.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        qualKeysRef.current.push(crypto.randomUUID());
                        field.pushValue({
                          degree: "",
                          institution: "",
                          year: new Date().getFullYear(),
                        });
                      }}
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Add Qualification
                    </Button>
                  </div>
                )}
              </form.Field>
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
                  disabled={!canSubmit || isSubmitting || isPending}
                  style={{ background: ACCENT }}
                >
                  {isSubmitting || isPending ? "Saving…" : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteDoctorDialogProps {
  doctor: DoctorListDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirmation dialog shown before a doctor record is soft-deleted
function DeleteDoctorDialog({ doctor, open, onOpenChange }: DeleteDoctorDialogProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useDeleteDoctorById();

  if (!doctor) return null;

  const handleConfirm = async () => {
    try {
      await mutateAsync({ id: String(doctor.doctorPublicId) });
      toast.success(`Dr. ${doctor.firstName} ${doctor.lastName} has been removed.`);
      await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.data?.title ?? "Failed to delete doctor.");
      } else {
        toast.error("Failed to delete doctor.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-lg font-semibold">Delete Doctor</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              Dr. {doctor.firstName} {doctor.lastName}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={handleConfirm}>
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Zod schema for add-doctor form — extends edit schema with password + IC number fields
const addDoctorSchema = editDoctorSchema.extend({
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  icNumber: z.string().min(1, "Required"),
});

// Default values for the add-doctor form — all fields start empty
const addDoctorDefaultValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  icNumber: "",
  phoneNumber: "",
  gender: "",
  dateOfBirth: "",
  bio: "",
  specialization: "",
  licenseNumber: "",
  consultationFee: null as number | null,
  departmentName: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressPostalCode: "",
  addressCountry: "",
  qualifications: [] as Array<{ degree: string; institution: string; year: number }>,
};

interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Dialog form for registering a new doctor
function AddDoctorDialog({ open, onOpenChange }: AddDoctorDialogProps) {
  // Stable UUID keys for qualification rows
  const qualKeysRef = useRef<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateDoctor();

  const form = useForm({
    defaultValues: addDoctorDefaultValues,
    validators: { onSubmit: addDoctorSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateDoctorCommand = {
        firstName: value.firstName,
        lastName: value.lastName,
        username: value.username,
        email: value.email,
        password: value.password,
        icNumber: value.icNumber,
        phoneNumber: value.phoneNumber || null,
        gender: value.gender[0] ?? "N",
        dateOfBirth: value.dateOfBirth,
        bio: value.bio || null,
        specialization: value.specialization,
        licenseNumber: value.licenseNumber,
        consultationFee: value.consultationFee,
        departmentName: value.departmentName,
        address: value.addressStreet
          ? {
              street: value.addressStreet,
              city: value.addressCity,
              state: value.addressState,
              postalCode: value.addressPostalCode,
              country: value.addressCountry,
            }
          : null,
        qualifications: value.qualifications.map((q) => ({
          degree: q.degree,
          institution: q.institution,
          year: q.year,
        })),
      };

      try {
        await mutateAsync({ data: payload });
        toast.success(`Dr. ${value.firstName} ${value.lastName} has been added.`);
        await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
        onOpenChange(false);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data?.title ?? "Failed to add doctor.");
        } else {
          toast.error("Failed to add doctor.");
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Accent bar */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              <Plus className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-none">
                Add New Doctor
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Fill in the doctor&apos;s details to register them in the system.
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
            <TabsList className="mb-5 grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
            </TabsList>

            {/* ── Personal ─────────────────────────────────────────────── */}
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
                        placeholder="e.g. Ahmad"
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
                        placeholder="e.g. Rahman"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. dr.ahmad"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. dr.ahmad@hospital.com"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel>Password</FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
              <form.Field name="icNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>IC Number</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 820101-14-5678"
                      className="font-mono"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
              <div className="grid grid-cols-2 gap-4">
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
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
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
              <form.Field name="bio">
                {(field) => (
                  <Field>
                    <FieldLabel>Bio</FieldLabel>
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      rows={3}
                      placeholder="Brief professional bio…"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            {/* ── Professional ─────────────────────────────────────────── */}
            <TabsContent
              value="professional"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="specialization">
                  {(field) => (
                    <Field>
                      <FieldLabel>Specialization</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="departmentName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Department</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology Department"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="licenseNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>License Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. MMC12345"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="consultationFee">
                  {(field) => (
                    <Field>
                      <FieldLabel>Consultation Fee (MYR)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        placeholder="e.g. 150.00"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            {/* ── Address ──────────────────────────────────────────────── */}
            <TabsContent
              value="address"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="addressStreet">
                {(field) => (
                  <Field>
                    <FieldLabel>Street</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 123 Jalan Ampang"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="addressCity">
                  {(field) => (
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Kuala Lumpur"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="addressState">
                  {(field) => (
                    <Field>
                      <FieldLabel>State</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Wilayah Persekutuan"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="addressPostalCode">
                  {(field) => (
                    <Field>
                      <FieldLabel>Postal Code</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. 50450"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="addressCountry">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Malaysia"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            {/* ── Qualifications ───────────────────────────────────────── */}
            <TabsContent
              value="qualifications"
              className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="qualifications" mode="array">
                {(field) => (
                  <div className="space-y-3">
                    {field.state.value.map((_, i) => (
                      <div
                        key={qualKeysRef.current[i]}
                        className="relative rounded-lg border border-border bg-muted/30 p-4"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Remove qualification"
                          onClick={() => {
                            qualKeysRef.current.splice(i, 1);
                            field.removeValue(i);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="grid grid-cols-3 gap-3">
                          <form.Field name={`qualifications[${i}].degree`}>
                            {(degreeField) => (
                              <Field>
                                <FieldLabel>Degree</FieldLabel>
                                <Input
                                  value={degreeField.state.value}
                                  onChange={(e) => degreeField.handleChange(e.target.value)}
                                  onBlur={degreeField.handleBlur}
                                  placeholder="e.g. MBBS"
                                />
                                <FieldError
                                  errors={
                                    degreeField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].institution`}>
                            {(instField) => (
                              <Field>
                                <FieldLabel>Institution</FieldLabel>
                                <Input
                                  value={instField.state.value}
                                  onChange={(e) => instField.handleChange(e.target.value)}
                                  onBlur={instField.handleBlur}
                                  placeholder="e.g. University of Malaya"
                                />
                                <FieldError
                                  errors={
                                    instField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].year`}>
                            {(yearField) => (
                              <Field>
                                <FieldLabel>Year</FieldLabel>
                                <Input
                                  type="number"
                                  value={yearField.state.value}
                                  onChange={(e) => yearField.handleChange(Number(e.target.value))}
                                  onBlur={yearField.handleBlur}
                                  placeholder="e.g. 2010"
                                  className="font-mono"
                                />
                                <FieldError
                                  errors={
                                    yearField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}

                    {field.state.value.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No qualifications added yet.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        qualKeysRef.current.push(crypto.randomUUID());
                        field.pushValue({
                          degree: "",
                          institution: "",
                          year: new Date().getFullYear(),
                        });
                      }}
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Add Qualification
                    </Button>
                  </div>
                )}
              </form.Field>
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
                  disabled={!canSubmit || isSubmitting || isPending}
                  style={{ background: ACCENT }}
                >
                  {isSubmitting || isPending ? "Adding…" : "Add Doctor"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<DoctorListDto>[] = [
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
    accessorKey: "departmentName",
    header: "Department",
    cell: ({ row }) => <span className="text-sm">{row.getValue("departmentName")}</span>,
  },
  {
    accessorKey: "specialization",
    header: "Specialty",
    cell: ({ row }) => (
      <span
        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
        style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: `${ACCENT}12` }}
      >
        {row.getValue("specialization")}
      </span>
    ),
  },
  {
    accessorKey: "licenseNumber",
    header: "License No.",
    cell: ({ row }) => <span className="font-mono text-xs">{row.getValue("licenseNumber")}</span>,
  },
  {
    accessorKey: "consultationFee",
    header: "Fee (MYR)",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        RM {(row.getValue<number | null>("consultationFee") ?? 0).toFixed(2)}
      </span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("phoneNumber") || "—"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">{formatDate(row.getValue("createdAt"))}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as {
        onView: (d: DoctorListDto) => void;
        onEdit: (d: DoctorListDto) => void;
        onDelete: (d: DoctorListDto) => void;
      };
      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="View details"
            onClick={() => meta.onView(row.original)}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Edit doctor"
            onClick={() => meta.onEdit(row.original)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Delete doctor"
            onClick={() => meta.onDelete(row.original)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      );
    },
  },
];

interface DataTableProps {
  data: DoctorListDto[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onView: (doctor: DoctorListDto) => void;
  onEdit: (doctor: DoctorListDto) => void;
  onDelete: (doctor: DoctorListDto) => void;
  onAdd: () => void;
}

function DataTable({
  data,
  page,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onView,
  onEdit,
  onDelete,
  onAdd,
}: DataTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView, onEdit, onDelete },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, username, email, specialty or license…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          <Plus className="mr-1.5 size-3.5" />
          Add New Doctor
        </Button>
      </div>

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
                  <p className="text-sm text-muted-foreground">No doctors found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Try adjusting your search.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

export function AdminDoctorsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorListDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDoctorForEdit, setSelectedDoctorForEdit] = useState<DoctorListDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDoctorForDelete, setSelectedDoctorForDelete] = useState<DoctorListDto | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data, isLoading } = useGetAll();
  const allDoctors = data?.status === 200 ? data.data : [];

  const handleView = (doctor: DoctorListDto) => {
    setSelectedDoctor(doctor);
    setDialogOpen(true);
  };

  const handleEdit = (doctor: DoctorListDto) => {
    setSelectedDoctorForEdit(doctor);
    setEditDialogOpen(true);
  };

  const handleDelete = (doctor: DoctorListDto) => {
    setSelectedDoctorForDelete(doctor);
    setDeleteDialogOpen(true);
  };

  const handleAdd = () => {
    setAddDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!search) return allDoctors;
    const q = search.toLowerCase();
    return allDoctors.filter(
      (d: DoctorListDto) =>
        `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.username.toLowerCase().includes(q) ||
        d.specialization.toLowerCase().includes(q) ||
        d.departmentName.toLowerCase().includes(q) ||
        d.licenseNumber.toLowerCase().includes(q),
    );
  }, [search, allDoctors]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-sm text-muted-foreground">
          View and manage all registered doctors
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="flex items-end justify-between px-6 pb-4 pt-6">
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: ACCENT }}
              >
                Doctors
              </p>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">All Doctors</h1>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                "Loading…"
              ) : (
                <>
                  <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                  {filtered.length === 1 ? "doctor" : "doctors"} found
                </>
              )}
            </p>
          </div>

          <Separator />

          <div className="p-6">
            <DataTable
              data={paged}
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              search={searchInput}
              onSearchChange={setSearchInput}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
            />
          </div>
        </div>
      </motion.div>

      <DoctorDetailsDialog doctor={selectedDoctor} open={dialogOpen} onOpenChange={setDialogOpen} />

      <EditDoctorDialog
        key={selectedDoctorForEdit?.doctorPublicId}
        doctor={selectedDoctorForEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <DeleteDoctorDialog
        doctor={selectedDoctorForDelete}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <AddDoctorDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </>
  );
}
