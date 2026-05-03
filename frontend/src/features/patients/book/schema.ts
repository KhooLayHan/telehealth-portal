import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import type { AvailableScheduleDto } from "@/api/model/AvailableScheduleDto";

export const SEVERITY_OPTIONS = ["Mild", "Moderate", "Severe"] as const;
export type Severity = (typeof SEVERITY_OPTIONS)[number];

export const symptomItemSchema = z.object({
  _id: z.string(),
  name: z.string().min(1, "Symptom name required").max(100, "Max 100 characters"),
  severity: z.enum(SEVERITY_OPTIONS, { error: "Select severity" }),
  duration: z.string().min(1, "Duration required (e.g., '3 days')").max(100, "Max 100 characters"),
});

export const bookingSchema = z.object({
  schedulePublicId: z.string().min(1, "Please select a time slot."),
  visitReason: z.string().min(5, "Please provide a reason (min 5 characters).").max(500),
  symptoms: z.array(symptomItemSchema).default([]),
});

export type SymptomItem = z.infer<typeof symptomItemSchema>;

export type BookingFormValues = z.infer<typeof bookingSchema>;

export const defaultValues: BookingFormValues = {
  schedulePublicId: "",
  visitReason: "",
  symptoms: [],
};

const createForm = () =>
  useForm({
    defaultValues,
  });

export type BookingFormInstance = ReturnType<typeof createForm>;

export type WizardStep = 1 | 2;

export type MedicalDetailsStepProps = {
  form: BookingFormInstance;
  onBack: () => void;
  bookingError: string | null;
  isPending: boolean;
};

export type ScheduleStepProps = {
  form: BookingFormInstance;
  onNext: () => void;
};

// Formats a NodaTime LocalTime string ("HH:mm:ss") to display form ("HH:mm").
export const formatLocalTime = (t: string): string => t.slice(0, 5);

export const getMinDate = () => {
  const today = new Date();
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
};

export function isValidSlot(slot: AvailableScheduleDto): slot is Required<AvailableScheduleDto> {
  return !!slot.publicId && !!slot.startTime && !!slot.endTime;
}

export function isPastSlot(slot: Pick<AvailableScheduleDto, "date" | "startTime">): boolean {
  return new Date(`${slot.date}T${slot.startTime}`) < new Date();
}
