import { useForm } from "@tanstack/react-form";
import { Activity, Plus, Save, Trash2, User } from "lucide-react";
import { useId } from "react";
import { z } from "zod";

import { useGetProfile, useUpdateMedicalRecord } from "@/api/generated/patients/patients";
import type { Allergy } from "@/api/model/Allergy";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SEVERITY_OPTIONS = ["mild", "moderate", "severe"] as const;
type Severity = (typeof SEVERITY_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  // crypto.randomUUID() is available in all modern browsers and Node 19+
  return crypto.randomUUID();
}

// Decorate backend allergies with a stable client-side ID for React keying.
// The `id` field is stripped before the payload reaches the API.
type AllergyFormItem = Allergy & { id: string };

function toFormAllergies(allergies: Allergy[] | null | undefined): AllergyFormItem[] {
  return (allergies ?? []).map((a) => ({ ...a, id: generateId() }));
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

// The emergency contact sub-schema validates only the *non-null* branch.
// When the value is null (no contact provided) the whole field is valid.
const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone is required"),
});

const allergyItemSchema = z.object({
  // `id` is client-only — present in form state, stripped on submit
  id: z.string(),
  allergen: z.string().min(1, "Allergen required"),
  severity: z.enum(SEVERITY_OPTIONS, { error: "Select severity" }),
  reaction: z.string().min(1, "Reaction required"),
});

const medicalInfoSchema = z.object({
  bloodGroup: z
    .string()
    .regex(/^(A|B|AB|O)[+-]$/, "Must be A+, O-, etc.")
    .or(z.literal("")),
  // null = no contact provided — valid. Non-null = all three fields required.
  emergencyContact: emergencyContactSchema.nullable(),
  allergies: z.array(allergyItemSchema).default([]),
});

type MedicalInfoFormValues = z.infer<typeof medicalInfoSchema>;

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

// Treat a blank object (the initial form state before the user types anything)
// the same as null so canSubmit stays true for patients with no contact.
function normalizeEmergencyContact(
  raw: MedicalInfoFormValues["emergencyContact"],
): Allergy extends never ? never : ReturnType<typeof emergencyContactSchema.parse> | null {
  if (!raw || (!raw.name && !raw.relationship && !raw.phone)) return null;
  return raw as ReturnType<typeof emergencyContactSchema.parse>;
}

// ---------------------------------------------------------------------------
// Inner form (only rendered after data loads)
// ---------------------------------------------------------------------------

type ProfileFormInnerProps = {
  profile: PatientProfileDto;
};

function ProfileFormInner({ profile }: ProfileFormInnerProps) {
  const updateMutation = useUpdateMedicalRecord();
  const bloodGroupId = useId();

  const defaultValues: MedicalInfoFormValues = {
    bloodGroup: profile.bloodGroup ?? "",
    // Default to null — an untouched blank contact must not block submission
    emergencyContact: profile.emergencyContact ?? null,
    allergies: toFormAllergies(profile.allergies),
  };

  const form = useForm;
  defaultValues, validators;
  :
  onChange: medicalInfoSchema,
  ,
    onSubmit: async (
  value;
  ) =>
  {
    // Strip the client-only `id` field before sending to the API
    const allergies: Allergy[] = value.allergies.map(({ id: _id, ...rest }) => rest);

    await updateMutation.mutateAsync({
        data: {
          bloodGroup: value.bloodGroup,
          emergencyContact: normalizeEmergencyContact(value.emergencyContact),
          allergies,
        },
      });
  }
  ,
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {/* ── Personal Information — read only ── */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="size-5 text-primary" /> Personal Information
          </CardTitle>
          <CardDescription>Basic details managed by your account settings.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="firstName" className="text-muted-foreground">
              First Name
            </Label>
            <Input id="firstName" value={profile.firstName} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName" className="text-muted-foreground">
              Last Name
            </Label>
            <Input id="lastName" value={profile.lastName} disabled className="bg-muted/50" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="email" className="text-muted-foreground">
              Email Address
            </Label>
            <Input id="email" value={profile.email} disabled className="bg-muted/50" />
          </div>
        </CardContent>
      </Card>

      {/* ── Medical Profile — editable ── */}
      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-primary" /> Medical Profile
          </CardTitle>
          <CardDescription>Update your clinical details and emergency contacts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blood Group */}
          <form.Field
            name="bloodGroup"
            validators={{ onChange: medicalInfoSchema.shape.bloodGroup }}
          >
            {(field) => (
              <div className="space-y-1.5 md:w-1/3">
                <Label htmlFor={bloodGroupId}>Blood Group</Label>
                <select
                  id={bloodGroupId}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
                )}
              </div>
            )}
          </form.Field>

          <Separator />

          {/* Emergency Contact
					    The field value is null (no contact) or a filled object.
					    When null: show an "Add" button. When non-null: show fields + Remove. */}
          <form.Field name="emergencyContact">
            {(field) => (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Emergency Contact</h3>
                  {field.state.value === null ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => field.handleChange({ name: "", relationship: "", phone: "" })}
                    >
                      <Plus className="mr-1 size-3" /> Add Contact
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => field.handleChange(null)}
                    >
                      <Trash2 className="mr-1 size-3" /> Remove
                    </Button>
                  )}
                </div>

                {field.state.value === null ? (
                  <p className="text-sm text-muted-foreground italic">
                    No emergency contact on record.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <form.Field name="emergencyContact.name">
                      {(subField) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Full Name
                          </Label>
                          <Input
                            id={`${subField.name}-input`}
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="emergencyContact.relationship">
                      {(subField) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Relationship
                          </Label>
                          <Input
                            id={`${subField.name}-input`}
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Spouse"
                          />
                        </div>
                      )}
                    </form.Field>
                    <form.Field name="emergencyContact.phone">
                      {(subField) => (
                        <div className="space-y-1.5">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Phone Number
                          </Label>
                          <Input
                            id={`${subField.name}-input`}
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="+60123456789"
                          />
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <Separator />

          {/* Allergies — keyed by stable client-side ID, not index */}
          <div className="space-y-3">
            <form.Field name="allergies">
              {(field) => (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">Allergies</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        field.pushValue({
                          id: generateId(),
                          allergen: "",
                          severity: "mild",
                          reaction: "",
                        })
                      }
                    >
                      <Plus className="mr-1 size-3" /> Add Allergy
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {field.state.value.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No allergies recorded.</p>
                    ) : (
                      field.state.value.map((allergy, i) => (
                        // Keyed by stable UUID — survives removal of earlier items
                        <div
                          key={allergy.id}
                          className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                        >
                          <div className="grid flex-1 gap-3 sm:grid-cols-3">
                            <form.Field name={`allergies[${i}].allergen`}>
                              {(subField) => (
                                <div className="space-y-1">
                                  <Label htmlFor={`${subField.name}-input`} className="text-xs">
                                    Allergen
                                  </Label>
                                  <Input
                                    id={`${subField.name}-input`}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) => subField.handleChange(e.target.value)}
                                    placeholder="Peanuts"
                                  />
                                </div>
                              )}
                            </form.Field>
                            <form.Field name={`allergies[${i}].severity`}>
                              {(subField) => (
                                <div className="space-y-1">
                                  <Label htmlFor={`${subField.name}-input`} className="text-xs">
                                    Severity
                                  </Label>
                                  <select
                                    id={`${subField.name}-input`}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) =>
                                      subField.handleChange(e.target.value as Severity)
                                    }
                                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                  >
                                    {SEVERITY_OPTIONS.map((s) => (
                                      <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </form.Field>
                            <form.Field name={`allergies[${i}].reaction`}>
                              {(subField) => (
                                <div className="space-y-1">
                                  <Label htmlFor={`${subField.name}-input`} className="text-xs">
                                    Reaction
                                  </Label>
                                  <Input
                                    id={`${subField.name}-input`}
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) => subField.handleChange(e.target.value)}
                                    placeholder="Hives, difficulty breathing"
                                  />
                                </div>
                              )}
                            </form.Field>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove allergy ${i + 1}`}
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => field.removeValue(i)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </form.Field>
          </div>

          <div className="flex justify-end pt-4">
            <form.Subscribe>
              {(state) => (
                <Button type="submit" disabled={!state.canSubmit || updateMutation.isPending}>
                  {updateMutation.isPending ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-2 size-4" /> Save Medical Profile
                    </>
                  )}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Public export — handles loading / error states
// ---------------------------------------------------------------------------

export function PatientMedicalProfileForm() {
  const { data: response, isLoading, isError } = useGetProfile();

  const profile = response?.status === 200 ? response.data : undefined;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
      >
        Failed to load profile data.
      </div>
    );
  }

  return <ProfileFormInner profile={profile} />;
}
