import { z } from "zod";

export const SEVERITY_OPTIONS = ["mild", "moderate", "severe"] as const;
export type Severity = (typeof SEVERITY_OPTIONS)[number];

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
