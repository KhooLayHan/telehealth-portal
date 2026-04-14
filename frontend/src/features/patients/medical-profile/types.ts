import type { FieldApi } from "@tanstack/react-form";
import { z } from "zod";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import type { MedicalProfileFormApi } from "./UseMedicalProfile";

export const SEVERITY_OPTIONS = ["mild", "moderate", "severe"] as const;
export const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;

export type Severity = (typeof SEVERITY_OPTIONS)[number];

export type AllergiesManagerProps = {
  form: MedicalProfileFormApi;
};

export type ProfileFormInnerProps = {
  profile: PatientProfileDto;
};

export type EmergencyContactFormProps = {
  form: MedicalProfileFormApi;
};

export type BloodGroupSelectProps = {
  field: FieldApi<MedicalInfoFormValues, "bloodGroup">;
  id: string;
};

export type PersonalInfoCardProps = {
  profile: PatientProfileDto;
};

export type AllergyFormItem = {
  id: string;
  allergen: string;
  severity: Severity;
  reaction: string;
};

export const emergencyContactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone is required"),
});

export const allergyItemSchema = z.object({
  id: z.string(),
  allergen: z.string().min(1, "Allergen required"),
  severity: z.enum(SEVERITY_OPTIONS, { error: "Select severity" }),
  reaction: z.string().min(1, "Reaction required"),
});

export const medicalInfoSchema = z.object({
  bloodGroup: z
    .string()
    .regex(/^(A|B|AB|O)[+-]$/, "Must be A+, O-, etc.")
    .or(z.literal("")),
  emergencyContact: emergencyContactSchema.nullable(),
  allergies: z.array(allergyItemSchema),
});

export type MedicalInfoFormValues = z.infer<typeof medicalInfoSchema>;
