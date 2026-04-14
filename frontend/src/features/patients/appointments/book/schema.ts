import type { useForm } from "@tanstack/react-form";
import { z } from "zod";

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

export type BookingFormValues = z.infer<typeof bookingSchema>;

export type BookingFormInstance = ReturnType<typeof useForm<BookingFormValues>>;

export type WizardStep = 1 | 2;
