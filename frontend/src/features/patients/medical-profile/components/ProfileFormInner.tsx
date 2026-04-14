import { useForm } from "@tanstack/react-form";
import { Activity, Plus, Save, Trash2 } from "lucide-react";
import { useId } from "react";

import { useUpdateMedicalRecord } from "@/api/generated/patients/patients";
import type { Allergy } from "@/api/model/Allergy";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { generateId, normalizeEmergencyContact, toFormAllergies } from "../helpers";
import {
  BLOOD_GROUP_OPTIONS,
  type MedicalInfoFormValues,
  medicalInfoSchema,
  type ProfileFormInnerProps,
  SEVERITY_OPTIONS,
  type Severity,
} from "../types";
import { PersonalInfoCard } from "./PersonalInfoCard";

export function ProfileFormInner({ profile }: ProfileFormInnerProps) {
  const updateMutation = useUpdateMedicalRecord();
  const bloodGroupId = useId();

  const defaultValues: MedicalInfoFormValues = {
    bloodGroup: profile.bloodGroup ?? "",
    emergencyContact: profile.emergencyContact ?? null,
    allergies: toFormAllergies(profile.allergies),
  };

  const form = useForm({
    defaultValues,
    validators: {
      onChange: medicalInfoSchema,
    },
    onSubmit: async ({ value }) => {
      const allergies: Allergy[] = value.allergies.map(({ id: _id, ...rest }) => rest);

      await updateMutation.mutateAsync({
        data: {
          bloodGroup: value.bloodGroup,
          emergencyContact: normalizeEmergencyContact(value.emergencyContact),
          allergies,
        },
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <PersonalInfoCard profile={profile} />

      <Card className="shadow-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="size-5 text-primary" /> Medical Profile
          </CardTitle>
          <CardDescription>Update your clinical details and emergency contacts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  {BLOOD_GROUP_OPTIONS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
                {field.state.meta.errors.length > 0 && (
                  <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
                )}
              </div>
            )}
          </form.Field>

          <Separator />

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
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Jane Doe"
                          />
                          {subField.state.meta.errors.length > 0 && (
                            <p id={`${subField.name}-error`} className="text-xs text-destructive">
                              {subField.state.meta.errors[0]?.message}
                            </p>
                          )}
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
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Spouse"
                          />
                          {subField.state.meta.errors.length > 0 && (
                            <p id={`${subField.name}-error`} className="text-xs text-destructive">
                              {subField.state.meta.errors[0]?.message}
                            </p>
                          )}
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
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value ?? ""}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="+60123456789"
                          />
                          {subField.state.meta.errors.length > 0 && (
                            <p id={`${subField.name}-error`} className="text-xs text-destructive">
                              {subField.state.meta.errors[0]?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                  </div>
                )}
              </div>
            )}
          </form.Field>

          <Separator />

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
                                    aria-describedby={
                                      subField.state.meta.errors.length > 0
                                        ? `${subField.name}-error`
                                        : undefined
                                    }
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) => subField.handleChange(e.target.value)}
                                    placeholder="Peanuts"
                                  />
                                  {subField.state.meta.errors.length > 0 && (
                                    <p
                                      id={`${subField.name}-error`}
                                      className="text-xs text-destructive"
                                    >
                                      {subField.state.meta.errors[0]?.message}
                                    </p>
                                  )}
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
                                    aria-describedby={
                                      subField.state.meta.errors.length > 0
                                        ? `${subField.name}-error`
                                        : undefined
                                    }
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
                                  {subField.state.meta.errors.length > 0 && (
                                    <p
                                      id={`${subField.name}-error`}
                                      className="text-xs text-destructive"
                                    >
                                      {subField.state.meta.errors[0]?.message}
                                    </p>
                                  )}
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
                                    aria-describedby={
                                      subField.state.meta.errors.length > 0
                                        ? `${subField.name}-error`
                                        : undefined
                                    }
                                    value={subField.state.value}
                                    onBlur={subField.handleBlur}
                                    onChange={(e) => subField.handleChange(e.target.value)}
                                    placeholder="Hives, difficulty breathing"
                                  />
                                  {subField.state.meta.errors.length > 0 && (
                                    <p
                                      id={`${subField.name}-error`}
                                      className="text-xs text-destructive"
                                    >
                                      {subField.state.meta.errors[0]?.message}
                                    </p>
                                  )}
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
