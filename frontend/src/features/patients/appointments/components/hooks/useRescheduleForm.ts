import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getGetAllAppointmentsQueryKey,
  useUpdateAppointmentBySlug,
} from "@/api/generated/patients/patients";
import type { ApiError } from "@/api/ofetch-mutator";
import { type RescheduleFormData, rescheduleSchema } from "../../schemas/rescheduleSchema";

type UseRescheduleFormProps = {
  appointmentSlug: string;
  onSuccess: () => void;
};

export function useRescheduleForm({ appointmentSlug, onSuccess }: UseRescheduleFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const rescheduleMutation = useUpdateAppointmentBySlug();

  const form = useForm({
    defaultValues: { newSchedulePublicId: "" } as RescheduleFormData,
    validators: {
      onChange: rescheduleSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await rescheduleMutation.mutateAsync({
          slug: appointmentSlug,
          data: value,
        });
        await queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
        onSuccess();
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.data?.detail || "Failed to reschedule appointment.");
      }
    },
  });

  return {
    form,
    error,
    isPending: rescheduleMutation.isPending,
    resetError: () => setError(null),
  };
}
