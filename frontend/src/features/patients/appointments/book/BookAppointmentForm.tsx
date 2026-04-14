import { useForm } from "@tanstack/react-form";
import { useState } from "react";

import { useCreate } from "@/api/generated/appointments/appointments";
import type { BookAppointmentCommand } from "@/api/model/BookAppointmentCommand";
import { Card } from "@/components/ui/card";

import { BookingSuccess } from "./BookingSuccess";
import { MedicalDetailsForm } from "./MedicalDetailsForm";
import { ProgressBar } from "./ProgressBar";
import { ScheduleForm } from "./ScheduleForm";
import type { BookingFormValues, WizardStep } from "./schema";

export function BookAppointmentForm() {
  const [step, setStep] = useState<WizardStep>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const bookMutation = useCreate();

  const defaultValues: BookingFormValues = {
    schedulePublicId: "",
    visitReason: "",
    symptoms: [],
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      setBookingError(null);

      // Strip the client-only `_id` field before building the API payload.
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
      {/* Progress bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className={`flex-1 h-2 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
        <div className="mx-4 text-sm font-medium text-muted-foreground">Step {step} of 2</div>
        <div className={`flex-1 h-2 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

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
