import { Button } from "@base-ui/react/button";
import { Separator } from "@base-ui/react/separator";
import { Activity, Save } from "lucide-react";
import { useId } from "react";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { medicalInfoSchema } from "../types";
import { useMedicalProfile } from "../UseMedicalProfile";
import { AllergiesManager } from "./AllergiesManager";
import { BloodGroupSelect } from "./BloodGroupSelect";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { PersonalInfoCard } from "./PersonalInfoCard";

function ProfileFormInner({ profile }: { profile: PatientProfileDto }) {
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
          <form.Field
            name="bloodGroup"
            validators={{ onChange: medicalInfoSchema.shape.bloodGroup }}
          >
            {(field) => <BloodGroupSelect field={field} id={bloodGroupId} />}
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
