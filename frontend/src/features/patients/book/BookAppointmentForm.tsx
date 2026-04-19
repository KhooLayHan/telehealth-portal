import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { useCreateAppointment } from "@/api/generated/appointments/appointments";
import type { BookAppointmentCommand } from "@/api/model/BookAppointmentCommand";
import { Card } from "@/components/ui/card";

import { BookingSuccess } from "./BookingSuccess";
import { MedicalDetailsForm } from "./MedicalDetailsForm";
import { ProgressBar } from "./ProgressBar";
import { ScheduleForm } from "./ScheduleForm";
import { defaultValues, type WizardStep } from "./schema";

export function BookAppointmentForm() {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookMutation = useCreateAppointment();

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: async ({ value }) => {
      setBookingError(null);

      const payload: BookAppointmentCommand = {
        schedulePublicId: value.schedulePublicId,
        visitReason: value.visitReason,
        symptoms:
          value.symptoms.length > 0
            ? value.symptoms.map(({ name, severity, duration }) => ({
                name,
                severity,
                duration,
              }))
            : null,
      };

      try {
        await bookMutation.mutateAsync({ data: payload });
        setIsSuccess(true);
      } catch {
        setBookingError("Something went wrong confirming your booking. Please try again.");
      }
    },
  });

  if (isSuccess) {
    return <BookingSuccess />;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <ProgressBar step={step} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <Card className="shadow-lg">
          {step === 1 && <ScheduleForm form={form} onNext={() => setStep(2)} />}
          {step === 2 && (
            <MedicalDetailsForm
              form={form}
              onBack={() => setStep(1)}
              bookingError={bookingError}
              isPending={bookMutation.isPending}
            />
          )}
        </Card>
      </form>
    </div>
  );
}
