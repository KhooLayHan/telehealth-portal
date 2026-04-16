import { z } from "zod";

export const rescheduleSchema = z.object({
  newSchedulePublicId: z.string().min(1, "Please select a new time slot."),
});

export type RescheduleFormData = z.infer<typeof rescheduleSchema>;
