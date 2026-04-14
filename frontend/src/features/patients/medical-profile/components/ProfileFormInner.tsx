import { Button } from "@base-ui/react/button";
import { Separator } from "@base-ui/react/separator";
import { Activity, Save } from "lucide-react";
import { useId } from "react";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { BLOOD_GROUP_OPTIONS, medicalInfoSchema } from "../types";
import { AllergiesManager } from "./AllergiesManager";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { useMedicalProfile } from "./UseMedicalProfile";

export function ProfileFormInner({ profile }: { profile: PatientProfileDto }) {
  const { form, updateMutation } = useMedicalProfile(profile);
  const bloodGroupId = useId();

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
          {/* Couldn't figure out how to extract out BloodGroupSelect... */}
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
          <EmergencyContactForm form={form} />
          <Separator />
          <div className="space-y-3">
            <AllergiesManager form={form} />
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
