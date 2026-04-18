import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { useUpdateBySlug } from "@/api/generated/lab-reports/lab-reports";
import {
  type BiomarkersFormProps,
  biomarkerSchema,
  createEmptyBiomarkerRow,
  defaultValues,
} from "../schema";

export type UseBiomarkersFormReturn = ReturnType<typeof useBiomarkersForm>;

export function useBiomarkersForm({ labReportId, onSuccess }: BiomarkersFormProps) {
  const completeMutation = useUpdateBySlug();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await completeMutation.mutateAsync({
          slug: labReportId,
          data: { biomarkers: value.biomarkers },
        });
        onSuccess();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to complete lab report.";
        setSubmitError(message);
      }
    },
  });

  return {
    form,
    completeMutation,
    submitError,
    biomarkerSchema,
    createEmptyBiomarkerRow,
  };
}
