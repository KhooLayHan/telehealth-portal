import { z } from "zod";

export const biomarkerSchema = z.object({
  name: z.string().min(1, "Name required"),
  value: z.string().min(1, "Value required"),
  unit: z.string().min(1, "Unit required"),
  referenceRange: z.string().min(1, "Range required"),
  flag: z.enum(["normal", "high", "low"]),
});

export const reportSchema = z.object({
  biomarkers: z.array(biomarkerSchema).default([]),
});

export type Biomarker = z.infer<typeof biomarkerSchema> & { _id: string };
export type FlagValue = "normal" | "high" | "low";
export type BiomarkersFormValues = z.infer<typeof reportSchema>;

export type BiomarkersFormProps = {
  labReportSlug: string;
  onBack: () => void;
  onSuccess: () => void;
};

export const defaultValues: BiomarkersFormValues = { biomarkers: [] };

export const createEmptyBiomarkerRow = (): Biomarker => ({
  _id: crypto.randomUUID(),
  name: "",
  value: "",
  unit: "",
  referenceRange: "",
  flag: "normal",
});
