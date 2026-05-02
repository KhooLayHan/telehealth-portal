import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import { getGetAllQueryKey, useUpdateDoctorById } from "@/api/generated/doctors/doctors";
import type { DoctorListDto } from "@/api/model/DoctorListDto";
import type { UpdateDoctorCommand } from "@/api/model/UpdateDoctorCommand";
import { ApiError } from "@/api/ofetch-mutator";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const icNumberRegex = /^\d{12}$/;
const dateOfBirthRegex = /^\d{4}-\d{2}-\d{2}$/;
const nameRegex = /^[A-Za-z ]+$/;
const usernameRegex = /^[A-Za-z0-9_.]+$/;
const phoneNumberRegex = /^\+\d{11,12}$/;
const malaysiaCountry = "Malaysia";
// Defines how many active departments are loaded for doctor department dropdowns.
const departmentSelectPageSize = 1000;
const malaysiaStates: readonly string[] = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
] as const;

const requiredText = (maxLength: number) =>
  z
    .string()
    .refine((value) => value.trim().length > 0, "Required")
    .refine((value) => value.trim().length <= maxLength, `Max ${maxLength} characters`);

const requiredName = z
  .string()
  .refine((value) => value.trim().length > 0, "Required")
  .refine((value) => value.trim().length <= 20, "Max 20 characters")
  .refine(
    (value) => value.trim().length === 0 || nameRegex.test(value.trim()),
    "Letters and spaces only",
  );

const requiredUsername = z
  .string()
  .refine((value) => value.trim().length > 0, "Required")
  .refine((value) => value.trim().length >= 3, "Min 3 characters")
  .refine((value) => value.trim().length <= 20, "Max 20 characters")
  .refine(
    (value) => value.trim().length === 0 || usernameRegex.test(value.trim()),
    "Letters, numbers, underscores, and dots only",
  );

const optionalText = (maxLength: number) =>
  z.string().refine((value) => value.trim().length <= maxLength, `Max ${maxLength} characters`);

const optionalPhoneNumber = z
  .string()
  .refine(
    (value) => value.trim().length === 0 || phoneNumberRegex.test(value.trim()),
    "Phone number must be 12-13 characters starting with + followed by digits only",
  );

const isValidDateOfBirth = (value: string) => {
  if (!dateOfBirthRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const isRealDate =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;

  return value <= todayKey;
};

const normalizeGender = (value?: string) => {
  if (!value) {
    return "";
  }

  const genderMap: Record<string, string> = {
    Female: "F",
    Male: "M",
    Other: "N",
    O: "N",
    "Prefer not to say": "N",
  };

  return genderMap[value] ?? value;
};

const editDoctorSchema = z
  .object({
    firstName: requiredName,
    lastName: requiredName,
    username: requiredUsername,
    email: z.string().trim().min(1, "Required").email("Invalid email").max(255),
    icNumber: z
      .string()
      .refine((value) => value.trim().length > 0, "Required")
      .refine(
        (value) => value.trim().length === 0 || icNumberRegex.test(value),
        "IC Number must be exactly 12 digits without dashes",
      ),
    phoneNumber: optionalPhoneNumber,
    gender: z.enum(["M", "F", "N"], { message: "Required" }),
    dateOfBirth: z
      .string()
      .min(1, "Required")
      .refine((value) => value.length === 0 || isValidDateOfBirth(value), {
        message: "Date of birth cannot be in the future",
      }),
    bio: optionalText(2000),
    specialization: requiredText(100),
    licenseNumber: requiredText(50),
    consultationFee: z.number().nonnegative("Must be >= 0").nullable(),
    departmentName: requiredText(100),
    addressStreet: optionalText(200),
    addressCity: optionalText(100),
    addressState: z
      .string()
      .refine(
        (value) => value.length === 0 || malaysiaStates.includes(value),
        "Select a Malaysia state",
      ),
    addressPostalCode: optionalText(20),
    addressCountry: z.literal(malaysiaCountry),
    qualifications: z.array(
      z.object({
        degree: requiredText(100),
        institution: requiredText(200),
        year: z.number().int().min(1900, "Min 1900").max(2100, "Max 2100"),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    const addressFields = [
      ["addressStreet", value.addressStreet],
      ["addressCity", value.addressCity],
      ["addressState", value.addressState],
      ["addressPostalCode", value.addressPostalCode],
    ] as const;

    const hasAnyAddressValue = addressFields.some(([, fieldValue]) => fieldValue.trim().length > 0);

    if (!hasAnyAddressValue) {
      return;
    }

    for (const [fieldName, fieldValue] of addressFields) {
      if (fieldValue.trim().length === 0) {
        ctx.addIssue({
          code: "custom",
          message: "Required",
          path: [fieldName],
        });
      }
    }
  });

function buildEditDefaultValues(doctor: DoctorListDto) {
  return {
    firstName: doctor.firstName ?? "",
    lastName: doctor.lastName ?? "",
    username: doctor.username ?? "",
    email: doctor.email ?? "",
    icNumber: doctor.icNumber ?? "",
    phoneNumber: doctor.phoneNumber ?? "",
    gender: normalizeGender(doctor.gender),
    dateOfBirth: String(doctor.dateOfBirth ?? ""),
    bio: doctor.bio ?? "",
    specialization: doctor.specialization ?? "",
    licenseNumber: doctor.licenseNumber ?? "",
    consultationFee: doctor.consultationFee == null ? null : Number(doctor.consultationFee),
    departmentName: doctor.departmentName ?? "",
    addressStreet: doctor.address?.street ?? "",
    addressCity: doctor.address?.city ?? "",
    addressState: doctor.address?.state ?? "",
    addressPostalCode: doctor.address?.postalCode ?? "",
    addressCountry: malaysiaCountry,
    qualifications: (doctor.qualifications ?? []).map((q) => ({
      degree: q.degree,
      institution: q.institution,
      year: q.year,
    })),
  };
}

interface EditDoctorFormProps {
  doctor: DoctorListDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDoctorForm({ doctor, open, onOpenChange }: EditDoctorFormProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useUpdateDoctorById();
  const initials = `${(doctor.firstName ?? "?")[0]}${(doctor.lastName ?? "?")[0]}`.toUpperCase();
  const {
    data: departmentsResponse,
    isError: isDepartmentsError,
    isLoading: isDepartmentsLoading,
  } = useAdminGetAllDepartments(
    { Page: 1, PageSize: departmentSelectPageSize },
    { query: { enabled: open } },
  );
  const departments = useMemo(
    () => (departmentsResponse?.status === 200 ? departmentsResponse.data.items : []),
    [departmentsResponse],
  );

  const qualKeysRef = useRef<string[]>(
    (doctor.qualifications ?? []).map(() => crypto.randomUUID()),
  );

  const form = useForm({
    defaultValues: buildEditDefaultValues(doctor),
    validators: { onSubmit: editDoctorSchema },
    onSubmit: async ({ value }) => {
      const addressStreet = value.addressStreet.trim();
      const addressCity = value.addressCity.trim();
      const addressState = value.addressState.trim();
      const addressPostalCode = value.addressPostalCode.trim();
      const hasAddress = [addressStreet, addressCity, addressState, addressPostalCode].some(
        (addressPart) => addressPart.length > 0,
      );

      const payload: UpdateDoctorCommand = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        username: value.username.trim(),
        email: value.email.trim(),
        icNumber: value.icNumber.trim(),
        phoneNumber: value.phoneNumber.trim() || null,
        gender: value.gender,
        dateOfBirth: value.dateOfBirth,
        bio: value.bio.trim() || null,
        specialization: value.specialization.trim(),
        licenseNumber: value.licenseNumber.trim(),
        consultationFee: value.consultationFee,
        departmentName: value.departmentName.trim(),
        address: hasAddress
          ? {
              street: addressStreet,
              city: addressCity,
              state: addressState,
              postalCode: addressPostalCode,
              country: malaysiaCountry,
            }
          : null,
        qualifications: value.qualifications.map((q) => ({
          degree: q.degree.trim(),
          institution: q.institution.trim(),
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
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Edit Dr. {doctor.firstName} {doctor.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Update profile details and save to apply changes.
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
            <TabsList className="mb-5 grid h-auto w-full grid-cols-2 rounded-lg border border-border bg-muted/30 p-1 sm:grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
            </TabsList>

            <TabsContent
              value="personal"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Personal Information
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>First Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Ahmad"
                        maxLength={20}
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
                        maxLength={20}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. dr_ahmad"
                        maxLength={20}
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
              <form.Field name="icNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>IC Number</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 820101145678"
                      className="font-mono"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value
                              .replace(/[^\d+]/g, "")
                              .replace(/(?!^)\+/g, "")
                              .slice(0, 13),
                          )
                        }
                        onBlur={field.handleBlur}
                        placeholder="+60162173366"
                        inputMode="tel"
                        maxLength={13}
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
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="N">Prefer not to say</SelectItem>
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
                      placeholder="Brief professional bio..."
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="professional"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Professional Details
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {isDepartmentsLoading && (
                            <SelectItem value="__loading" disabled>
                              Loading departments...
                            </SelectItem>
                          )}
                          {isDepartmentsError && (
                            <SelectItem value="__error" disabled>
                              Failed to load departments
                            </SelectItem>
                          )}
                          {!isDepartmentsLoading &&
                            !isDepartmentsError &&
                            departments.length === 0 && (
                              <SelectItem value="__empty" disabled>
                                No departments available
                              </SelectItem>
                            )}
                          {departments.map((department) => (
                            <SelectItem key={department.slug} value={department.name}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <TabsContent
              value="address"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Address
              </p>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {malaysiaStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        onBlur={field.handleBlur}
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/50"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            <TabsContent
              value="qualifications"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Qualifications
              </p>
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

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-muted-foreground text-sm">
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

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
                  {isSubmitting || isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
