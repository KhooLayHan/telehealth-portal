import { useForm } from "@tanstack/react-form";

import { useUpdateMedicalRecord } from "@/api/generated/patients/patients";
import type { Allergy } from "@/api/model/Allergy";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { normalizeEmergencyContact, toFormAllergies } from "../helpers";
import { type MedicalInfoFormValues, medicalInfoSchema } from "../types";

export function useMedicalProfile(profile: PatientProfileDto) {
  const updateMutation = useUpdateMedicalRecord();

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
      const allergies: Allergy[] = value.allergies.map(({ id: _id, ...rest }) => ({
        ...rest,
        severity: rest.severity.charAt(0).toUpperCase() + rest.severity.slice(1),
      }));

      await updateMutation.mutateAsync({
        data: {
          bloodGroup: value.bloodGroup,
          emergencyContact: normalizeEmergencyContact(value.emergencyContact),
          allergies,
        },
      });
    },
  });

  return { form, updateMutation };
}

export type MedicalProfileFormApi = ReturnType<typeof useMedicalProfile>["form"];
