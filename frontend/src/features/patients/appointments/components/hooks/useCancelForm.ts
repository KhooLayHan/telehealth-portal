import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  getGetAllAppointmentsQueryKey,
  useDeleteAppointmentBySlug,
} from "@/api/generated/patients/patients";
import type { ApiError } from "@/api/ofetch-mutator";
import { type CancelFormData, cancelSchema } from "../../schemas/cancelSchema";

type UseCancelFormProps = {
  appointmentSlug: string;
  onSuccess: () => void;
};

export function useCancelForm({ appointmentSlug, onSuccess }: UseCancelFormProps) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const cancelMutation = useDeleteAppointmentBySlug();

  const form = useForm({
    defaultValues: { cancellationReason: "" } as CancelFormData,
    validators: {
      onChange: cancelSchema,
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await cancelMutation.mutateAsync({
          slug: appointmentSlug,
          data: value,
        });
        await queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
        onSuccess();
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.data?.detail || "Failed to cancel appointment.");
      }
    },
  });

  return {
    form,
    error,
    isPending: cancelMutation.isPending,
    resetError: () => setError(null),
  };
}
