import { Separator } from "@base-ui/react/separator";
import { Activity, Save } from "lucide-react";
import { useId } from "react";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOOD_GROUP_OPTIONS, medicalInfoSchema } from "../types";
import { AllergiesManager } from "./AllergiesManager";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { FormField } from "./FormField";
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
          <form.Field
            name="bloodGroup"
            validators={{ onChange: medicalInfoSchema.shape.bloodGroup }}
          >
            {(field) => (
              <div className="md:w-1/3">
                <FormField label="Blood Group" error={field.state.meta.errors[0]?.message}>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value ?? "")}
                  >
                    <SelectTrigger id={bloodGroupId} className="w-full">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_GROUP_OPTIONS.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            )}
          </form.Field>
          <Separator />
          <EmergencyContactForm form={form} />
          <Separator />
          <div className="space-y-3">
            <AllergiesManager form={form} />
          </div>
          <div className="flex justify-end pt-4 cursor-pointer">
            <form.Subscribe>
              {(state) => (
                <Button
                  type="submit"
                  className="cursor-pointer"
                  disabled={!state.canSubmit || updateMutation.isPending}
                >
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
