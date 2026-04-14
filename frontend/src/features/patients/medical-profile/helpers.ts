import type { Allergy } from "@/api/model/Allergy";
import type { AllergyFormItem, MedicalInfoFormValues, Severity } from "./types";
import { SEVERITY_OPTIONS } from "./types";

export function generateId(): string {
  return crypto.randomUUID();
}

export function toFormAllergies(allergies: Allergy[] | null | undefined): AllergyFormItem[] {
  return (allergies ?? []).map((a) => ({
    id: generateId(),
    allergen: a.allergen,
    reaction: a.reaction,
    severity: (SEVERITY_OPTIONS as readonly string[]).includes(a.severity)
      ? (a.severity as Severity)
      : "mild",
  }));
}

export function normalizeEmergencyContact(
  raw: MedicalInfoFormValues["emergencyContact"],
): { name: string; relationship: string; phone: string } | null {
  if (!raw || (!raw.name && !raw.relationship && !raw.phone)) return null;
  return raw;
}
