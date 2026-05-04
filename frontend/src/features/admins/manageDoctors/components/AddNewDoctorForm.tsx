import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import { getGetAllQueryKey, useCreateDoctor } from "@/api/generated/doctors/doctors";
import type { CreateDoctorCommand } from "@/api/model/CreateDoctorCommand";
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
const specialCharacterRegex = /[^a-zA-Z0-9]/;
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

  return value < todayKey;
};

// Formats yesterday as a local date input value.
function getYesterdayDateInputValue(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const addDoctorSchema = z
  .object({
    firstName: requiredName,
    lastName: requiredName,
    username: requiredUsername,
    email: z.string().trim().min(1, "Required").email("Invalid email").max(255),
    password: z
      .string()
      .min(8, "Min 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number")
      .regex(specialCharacterRegex, "Must contain a special character"),
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
        message: "Date of birth cannot be today or in the future",
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
  addressCountry: malaysiaCountry,
  qualifications: [] as Array<{ degree: string; institution: string; year: number }>,
};

interface AddNewDoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNewDoctorForm({ open, onOpenChange }: AddNewDoctorFormProps) {
  const qualKeysRef = useRef<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateDoctor();
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

  const form = useForm({
    defaultValues: addDoctorDefaultValues,
    validators: { onSubmit: addDoctorSchema },
    onSubmit: async ({ value }) => {
      const addressStreet = value.addressStreet.trim();
      const addressCity = value.addressCity.trim();
      const addressState = value.addressState.trim();
      const addressPostalCode = value.addressPostalCode.trim();
      const hasAddress = [addressStreet, addressCity, addressState, addressPostalCode].some(
        (addressPart) => addressPart.length > 0,
      );

      const payload: CreateDoctorCommand = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        username: value.username.trim(),
        email: value.email.trim(),
        password: value.password,
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
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              <Plus className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Add New Doctor
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
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
                      max={getYesterdayDateInputValue()}
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
                  {isSubmitting || isPending ? "Adding..." : "Add Doctor"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
