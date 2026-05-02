import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useSignUpPatient } from "@/api/generated/auth/auth";
import {
  getGetAllPatientsForClinicStaffQueryKey,
  useUpdatePatientRecord,
} from "@/api/generated/patients/patients";
import type { RegisterPatientCommand } from "@/api/model/RegisterPatientCommand";
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

// Lists the selectable blood groups for the patient record form.
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

// Lists the gender codes accepted by the patient registration API.
const GENDERS = ["M", "F", "O", "N"] as const;

// Lists the selectable allergy severities accepted by the patient record API.
const ALLERGY_SEVERITIES = ["Mild", "Moderate", "Severe"] as const;

// Matches Malaysian IC numbers in the backend format: 12 digits without dashes.
const MALAYSIAN_IC_REGEX = /^\d{12}$/;

// Checks that a form date string is not later than today's local date.
function isNotFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate <= today;
}

// Validates a single allergy row in the add-patient form.
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

// Validates the full patient registration form.
const addPatientSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100),
    lastName: z.string().trim().min(1, "Last name is required").max(100),
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(50),
    email: z.string().trim().email("Valid email is required").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    icNumber: z
      .string()
      .trim()
      .regex(MALAYSIAN_IC_REGEX, "IC number must be exactly 12 digits without dashes"),
    gender: z
      .string()
      .refine(
        (gender) => GENDERS.includes(gender as (typeof GENDERS)[number]),
        "Gender must be M, F, O, or N",
      ),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(isNotFutureDate, "Date of birth cannot be in the future"),
    phoneNumber: z.string().trim().max(16, "Phone number must be 16 characters or fewer"),
    bloodGroup: z.string().refine((bloodGroup) => {
      return (
        bloodGroup === "" || BLOOD_GROUPS.includes(bloodGroup as (typeof BLOOD_GROUPS)[number])
      );
    }, "Blood group must be valid"),
    allergies: z.array(allergySchema),
    emergencyContactName: z.string().trim().max(100),
    emergencyContactRelationship: z.string().trim().max(50),
    emergencyContactPhone: z.string().trim().max(16, "Phone number must be 16 characters or fewer"),
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
  });

// Describes the values collected by the add-patient form.
type AddPatientFormValues = z.infer<typeof addPatientSchema>;

// Provides the initial empty state for a new patient form.
const addPatientDefaultValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  icNumber: "",
  gender: "",
  dateOfBirth: "",
  phoneNumber: "",
  bloodGroup: "",
  allergies: [] as AddPatientFormValues["allergies"],
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
} satisfies AddPatientFormValues;

// Describes the dialog state passed in from the patient management page.
interface AddNewPatientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Renders the dialog for registering a new patient account and optional medical details.
export function AddNewPatientForm({ open, onOpenChange }: AddNewPatientFormProps) {
  const queryClient = useQueryClient();
  const allergyKeysRef = useRef<string[]>([]);
  const { mutateAsync: registerPatientAsync, isPending: isRegistering } = useSignUpPatient();
  const { mutateAsync: updateRecordAsync, isPending: isUpdating } = useUpdatePatientRecord();
  const isPending = isRegistering || isUpdating;

  const form = useForm({
    defaultValues: addPatientDefaultValues,
    validators: { onSubmit: addPatientSchema },
    onSubmit: async ({ value }) => {
      const registerPayload: RegisterPatientCommand = {
        firstName: value.firstName,
        lastName: value.lastName,
        username: value.username,
        email: value.email,
        password: value.password,
        icNumber: value.icNumber,
        gender: value.gender,
        dateOfBirth: value.dateOfBirth,
      };

      try {
        const response = await registerPatientAsync({ data: registerPayload });

        if (response.status === 201) {
          const { patientPublicId } = response.data;
          const hasAllergies = value.allergies.length > 0;
          const hasEmergencyContact = !!value.emergencyContactName;
          const hasExtraData =
            hasAllergies || hasEmergencyContact || !!value.phoneNumber || !!value.bloodGroup;

          if (hasExtraData) {
            const updatePayload: UpdatePatientRecordCommand = {
              firstName: value.firstName,
              lastName: value.lastName,
              username: value.username,
              email: value.email,
              icNumber: value.icNumber,
              dateOfBirth: value.dateOfBirth,
              phoneNumber: value.phoneNumber || null,
              gender: value.gender || "N",
              bloodGroup: value.bloodGroup || null,
              emergencyContact: value.emergencyContactName
                ? {
                    name: value.emergencyContactName,
                    relationship: value.emergencyContactRelationship,
                    phone: value.emergencyContactPhone,
                  }
                : null,
              allergies: value.allergies.map((allergy) => ({
                allergen: allergy.allergen,
                severity: allergy.severity,
                reaction: allergy.reaction,
              })),
            };

            await updateRecordAsync({
              patientPublicId,
              data: updatePayload,
            });
          }

          toast.success("Patient registered successfully");
          await queryClient.invalidateQueries({
            queryKey: getGetAllPatientsForClinicStaffQueryKey(),
          });
          onOpenChange(false);
        }
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to register patient");
        } else {
          toast.error("Failed to register patient");
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
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Add New Patient
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Creates a new patient account. Allergies and emergency contacts are optional.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col"
        >
          <Tabs defaultValue="personal" className="flex-1 px-6 pb-4">
            <TabsList className="mb-5 grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="allergies">Allergies</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. John"
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Doe"
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. johndoe"
                        autoComplete="off"
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. john@example.com"
                        autoComplete="off"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="password">
                  {(field) => (
                    <Field>
                      <FieldLabel>Password</FieldLabel>
                      <Input
                        type="password"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Min. 8 characters"
                        autoComplete="new-password"
                      />
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
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. 920101011234"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                        onValueChange={(value) => field.handleChange(value ?? "")}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+601x-xxxxxxx"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>

            <TabsContent value="allergies" className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1">
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
                                  errors={
                                    allergenField.state.meta.errors as Array<{ message?: string }>
                                  }
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
                                  errors={
                                    severityField.state.meta.errors as Array<{ message?: string }>
                                  }
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
                                  errors={
                                    reactionField.state.meta.errors as Array<{ message?: string }>
                                  }
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
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                        onChange={(event) => field.handleChange(event.target.value)}
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

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting || isPending}>
                  {isSubmitting || isPending ? "Adding..." : "Add Patient"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
