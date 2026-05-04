import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  getGetAllPatientsForClinicStaffQueryKey,
  useUpdatePatientRecord,
} from "@/api/generated/patients/patients";
import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
import type { UpdatePatientRecordCommand } from "@/api/model/UpdatePatientRecordCommand";
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

// Lists the selectable blood groups for the patient record edit form.
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

// Lists the gender codes accepted by the patient registration API.
const GENDERS = ["M", "F", "N"] as const;

// Lists the selectable allergy severities accepted by the patient record API.
const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

// Lists the tab values available in the patient edit dialog.
const EDIT_PATIENT_TABS = ["personal", "account", "allergies", "emergency"] as const;

// Maps form root fields to the tab where the user can correct them.
const EDIT_PATIENT_FIELD_TABS = {
  firstName: "personal",
  lastName: "personal",
  dateOfBirth: "personal",
  gender: "personal",
  phoneNumber: "personal",
  bloodGroup: "personal",
  username: "account",
  email: "account",
  icNumber: "account",
  allergies: "allergies",
  emergencyContactName: "emergency",
  emergencyContactRelationship: "emergency",
  emergencyContactPhone: "emergency",
} as const satisfies Record<string, EditPatientTab>;

// Describes the tab ids used by the edit-patient form.
type EditPatientTab = (typeof EDIT_PATIENT_TABS)[number];

// Matches Malaysian IC numbers in the backend format: 12 digits without dashes.
const MALAYSIAN_IC_REGEX = /^\d{12}$/;

// Matches names containing only letters and spaces.
const PATIENT_NAME_REGEX = /^[A-Za-z ]+$/;

// Matches usernames containing only letters, numbers, underscores, and dots.
const USERNAME_REGEX = /^[A-Za-z0-9_.]+$/;

// Matches international phone numbers with a + prefix and 11-12 digits.
const PHONE_NUMBER_REGEX = /^\+\d{11,12}$/;

// Checks that a form date string is before today's local date.
function isPastDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate < today;
}

// Formats yesterday as a local date input value.
function getYesterdayDateInputValue(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Validates a single allergy row in the edit-patient form.
const allergySchema = z.object({
  allergen: z.string().trim().min(1, "Allergen is required").max(100),
  severity: z
    .string()
    .refine(
      (severity) => ALLERGY_SEVERITIES.includes(severity as (typeof ALLERGY_SEVERITIES)[number]),
      "Severity must be Mild, Moderate, or Severe",
    ),
  reaction: z.string().trim().min(1, "Reaction is required").max(255),
});

// Validates the full patient edit form before saving the record.
const editPatientSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(20, "First name must be 20 characters or fewer")
      .regex(PATIENT_NAME_REGEX, "First name can only contain letters and spaces"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(20, "Last name must be 20 characters or fewer")
      .regex(PATIENT_NAME_REGEX, "Last name can only contain letters and spaces"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be 20 characters or fewer")
      .regex(USERNAME_REGEX, "Username can only contain letters, numbers, underscores, and dots"),
    email: z.string().trim().email("Valid email is required").max(255),
    icNumber: z
      .string()
      .trim()
      .regex(MALAYSIAN_IC_REGEX, "IC number must be exactly 12 digits without dashes"),
    gender: z
      .string()
      .refine(
        (gender) => GENDERS.includes(gender as (typeof GENDERS)[number]),
        "Gender must be male, female, or prefer not to say",
      ),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(isPastDate, "Date of birth cannot be today or in the future"),
    phoneNumber: z
      .string()
      .trim()
      .refine((phoneNumber) => {
        return phoneNumber.length === 0 || PHONE_NUMBER_REGEX.test(phoneNumber);
      }, "Phone number must be 12-13 characters starting with + followed by digits only"),
    bloodGroup: z.string().refine((bloodGroup) => {
      return (
        bloodGroup === "" || BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number])
      );
    }, "Blood group must be valid"),
    allergies: z.array(allergySchema),
    emergencyContactName: z.string().trim().max(100),
    emergencyContactRelationship: z.string().trim().max(50),
    emergencyContactPhone: z.string().trim(),
  })
  .superRefine((value, context) => {
    const emergencyContactFields = [
      {
        field: "emergencyContactName",
        message: "Emergency contact name is required",
        value: value.emergencyContactName,
      },
      {
        field: "emergencyContactRelationship",
        message: "Emergency contact relationship is required",
        value: value.emergencyContactRelationship,
      },
      {
        field: "emergencyContactPhone",
        message: "Emergency contact phone is required",
        value: value.emergencyContactPhone,
      },
    ] as const;
    const hasEmergencyContact = emergencyContactFields.some((field) => field.value.length > 0);

    if (!hasEmergencyContact) {
      return;
    }

    for (const field of emergencyContactFields) {
      if (field.value.length === 0) {
        context.addIssue({
          code: "custom",
          message: field.message,
          path: [field.field],
        });
      }
    }

    if (
      value.emergencyContactPhone.length > 0 &&
      !PHONE_NUMBER_REGEX.test(value.emergencyContactPhone)
    ) {
      context.addIssue({
        code: "custom",
        message: "Emergency contact phone must be 12-13 characters with + and digits only",
        path: ["emergencyContactPhone"],
      });
    }
  });

// Describes the values captured by the edit-patient form.
type EditPatientFormValues = z.infer<typeof editPatientSchema>;

// Describes the selected patient and dialog state for the edit-patient form.
interface EditPatientFormProps {
  patient: ClinicStaffPatientDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Describes the mounted edit-patient form once a row is selected.
interface EditPatientFormContentProps {
  patient: ClinicStaffPatientDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Converts a patient table row into editable form values.
function buildEditPatientValues(patient: ClinicStaffPatientDto): EditPatientFormValues {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    username: patient.username,
    email: patient.email,
    icNumber: patient.icNumber,
    dateOfBirth: String(patient.dateOfBirth),
    phoneNumber: patient.phoneNumber || "",
    gender: patient.gender || "N",
    bloodGroup: patient.bloodGroup || "",
    allergies: (patient.allergies ?? []).map((allergy) => ({
      allergen: allergy.allergen,
      severity: allergy.severity,
      reaction: allergy.reaction,
    })),
    emergencyContactName: patient.emergencyContact?.name ?? "",
    emergencyContactRelationship: patient.emergencyContact?.relationship ?? "",
    emergencyContactPhone: patient.emergencyContact?.phone ?? "",
  };
}

// Builds stable React keys for editable allergy rows.
function buildAllergyKeys(patient: ClinicStaffPatientDto): string[] {
  return (patient.allergies ?? []).map(
    (allergy, index) => `${allergy.allergen}-${allergy.severity}-${index}`,
  );
}

// Builds stable initials for the selected patient avatar.
function getInitials(patient: ClinicStaffPatientDto): string {
  const firstInitial = patient.firstName.trim().at(0) ?? "";
  const lastInitial = patient.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "P";
}

// Converts TanStack Form validation results into shadcn field error objects.
function toFieldErrors(errors: unknown[]): Array<{ message: string }> {
  return errors.map((error) => ({
    message:
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : String(error),
  }));
}

// Reads the root form field from a TanStack/Zod validation error object.
function getErrorRootField(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  if (
    "path" in error &&
    Array.isArray(error.path) &&
    typeof error.path[0] === "string" &&
    error.path[0].length > 0
  ) {
    return error.path[0];
  }

  for (const [key, value] of Object.entries(error)) {
    if (key in EDIT_PATIENT_FIELD_TABS) {
      return key;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nestedField = getErrorRootField(item);

        if (nestedField) {
          return nestedField;
        }
      }
    } else {
      const nestedField = getErrorRootField(value);

      if (nestedField) {
        return nestedField;
      }
    }
  }

  return null;
}

// Finds the tab that contains the first invalid edit-patient field.
function getFirstInvalidTab(errors: unknown[]): EditPatientTab | null {
  for (const error of errors) {
    const rootField = getErrorRootField(error);

    if (rootField && rootField in EDIT_PATIENT_FIELD_TABS) {
      return EDIT_PATIENT_FIELD_TABS[rootField as keyof typeof EDIT_PATIENT_FIELD_TABS];
    }
  }

  return null;
}

// Renders the selected patient edit dialog when a table row is active.
export function EditPatientForm({ patient, open, onOpenChange }: EditPatientFormProps) {
  if (!patient) {
    return null;
  }

  return (
    <EditPatientFormContent
      key={patient.patientPublicId}
      patient={patient}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

// Renders a prefilled form for editing patient details through the backend.
function EditPatientFormContent({ patient, open, onOpenChange }: EditPatientFormContentProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<EditPatientTab>("personal");
  const allergyKeysRef = useRef<string[]>(buildAllergyKeys(patient));
  const { mutateAsync, isPending } = useUpdatePatientRecord();

  const form = useForm({
    defaultValues: buildEditPatientValues(patient),
    validators: { onSubmit: editPatientSchema },
    onSubmitInvalid: ({ formApi }) => {
      const invalidTab = getFirstInvalidTab(formApi.state.errors);

      if (invalidTab) {
        setActiveTab(invalidTab);
      }

      toast.error("Please fix the highlighted fields before saving.");
    },
    onSubmit: async ({ value }) => {
      const hasEmergencyContact = value.emergencyContactName.trim().length > 0;
      const updatePayload: UpdatePatientRecordCommand = {
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        username: value.username.trim(),
        email: value.email.trim(),
        icNumber: value.icNumber.trim(),
        dateOfBirth: value.dateOfBirth,
        phoneNumber: value.phoneNumber.trim() || null,
        gender: value.gender || "N",
        bloodGroup: value.bloodGroup || null,
        emergencyContact: hasEmergencyContact
          ? {
              name: value.emergencyContactName.trim(),
              relationship: value.emergencyContactRelationship.trim(),
              phone: value.emergencyContactPhone.trim(),
            }
          : null,
        allergies: value.allergies.map((allergy) => ({
          allergen: allergy.allergen.trim(),
          severity: allergy.severity,
          reaction: allergy.reaction.trim(),
        })),
      };

      try {
        await mutateAsync({
          patientPublicId: patient.patientPublicId,
          data: updatePayload,
        });
        toast.success("Patient details updated successfully");
        await queryClient.invalidateQueries({
          queryKey: getGetAllPatientsForClinicStaffQueryKey(),
        });
        onOpenChange(false);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to update patient");
          return;
        }

        toast.error("Failed to update patient");
      }
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(buildEditPatientValues(patient));
      allergyKeysRef.current = buildAllergyKeys(patient);
      setActiveTab("personal");
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              {getInitials(patient)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <DialogTitle className="font-semibold text-xl leading-none">
                  {patient.firstName} {patient.lastName}
                </DialogTitle>
                {patient.bloodGroup && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                    <Heart className="size-2.5" />
                    {patient.bloodGroup}
                  </span>
                )}
              </div>
              <DialogDescription className="mt-1 text-sm">
                Update patient profile, allergy, and emergency contact details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
          className="flex flex-col"
        >
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as EditPatientTab)}
            className="flex-1 px-6 pb-4"
          >
            <TabsList className="mb-5 grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent
              value="personal"
              keepMounted
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. John"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Last Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Doe"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="dateOfBirth">
                  {(field) => (
                    <Field>
                      <FieldLabel>Date of Birth</FieldLabel>
                      <Input
                        type="date"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        max={getYesterdayDateInputValue()}
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel>Gender</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value ?? "")}
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
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+60162173366"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="bloodGroup">
                  {(field) => (
                    <Field>
                      <FieldLabel>Blood Group</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((bloodGroup) => (
                            <SelectItem key={bloodGroup} value={bloodGroup}>
                              {bloodGroup}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            <TabsContent
              value="account"
              keepMounted
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Account Information
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. patient.john"
                        autoComplete="off"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. patient@example.com"
                        autoComplete="off"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="12 digits without dashes"
                      className="font-mono"
                      autoComplete="off"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="allergies"
              keepMounted
              className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="allergies" mode="array">
                {(field) => (
                  <div className="space-y-3">
                    <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                      Allergies
                    </p>

                    {field.state.value.map((_, index) => (
                      <div
                        key={allergyKeysRef.current[index]}
                        className="relative rounded-lg border border-border bg-muted/30 px-4 py-3"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Remove allergy"
                          onClick={() => {
                            allergyKeysRef.current.splice(index, 1);
                            field.removeValue(index);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="grid grid-cols-1 gap-3 pr-8 sm:grid-cols-3">
                          <form.Field name={`allergies[${index}].allergen`}>
                            {(allergenField) => (
                              <Field>
                                <FieldLabel>Allergen</FieldLabel>
                                <Input
                                  value={allergenField.state.value}
                                  onChange={(event) =>
                                    allergenField.handleChange(event.target.value)
                                  }
                                  onBlur={allergenField.handleBlur}
                                  placeholder="e.g. Penicillin"
                                />
                                <FieldError
                                  errors={toFieldErrors(allergenField.state.meta.errors)}
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`allergies[${index}].severity`}>
                            {(severityField) => (
                              <Field>
                                <FieldLabel>Severity</FieldLabel>
                                <Select
                                  value={severityField.state.value}
                                  onValueChange={(value) => severityField.handleChange(value ?? "")}
                                >
                                  <SelectTrigger
                                    className="w-full"
                                    onBlur={severityField.handleBlur}
                                  >
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Mild">Mild</SelectItem>
                                    <SelectItem value="Moderate">Moderate</SelectItem>
                                    <SelectItem value="Severe">Severe</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FieldError
                                  errors={toFieldErrors(severityField.state.meta.errors)}
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`allergies[${index}].reaction`}>
                            {(reactionField) => (
                              <Field>
                                <FieldLabel>Reaction</FieldLabel>
                                <Input
                                  value={reactionField.state.value}
                                  onChange={(event) =>
                                    reactionField.handleChange(event.target.value)
                                  }
                                  onBlur={reactionField.handleBlur}
                                  placeholder="e.g. Rash, swelling"
                                />
                                <FieldError
                                  errors={toFieldErrors(reactionField.state.meta.errors)}
                                />
                              </Field>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}

                    {field.state.value.length === 0 && (
                      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-muted-foreground text-sm">
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
                        field.pushValue({ allergen: "", severity: "Mild", reaction: "" });
                      }}
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Add Allergy
                    </Button>
                  </div>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="emergency"
              keepMounted
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <p className="font-semibold text-[10px] text-primary uppercase tracking-[0.2em]">
                Emergency Contact
              </p>

              <form.Field name="emergencyContactName">
                {(field) => (
                  <Field>
                    <FieldLabel>Full Name</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. Jane Doe"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="emergencyContactRelationship">
                  {(field) => (
                    <Field>
                      <FieldLabel>Relationship</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Spouse, Parent"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="emergencyContactPhone">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+60162173366"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" disabled={isSubmitting || isPending}>
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
