import { z } from "zod";

export const cancelSchema = z.object({
  cancellationReason: z.string().min(5, "Reason must be at least 5 characters").max(500),
});

export type CancelFormData = z.infer<typeof cancelSchema>;
