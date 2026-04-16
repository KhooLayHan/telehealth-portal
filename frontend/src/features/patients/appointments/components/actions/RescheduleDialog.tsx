import type { AppointmentDto } from "@/api/model/AppointmentDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RescheduleAppointmentForm } from "../forms/RescheduleAppointmentForm";
import { useRescheduleForm } from "../hooks/useRescheduleForm";

type RescheduleDialogProps = {
  appointment: AppointmentDto;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RescheduleDialog({ appointment, isOpen, onOpenChange }: RescheduleDialogProps) {
  const { form, error, isPending, resetError } = useRescheduleForm({
    appointmentSlug: appointment.slug,
    onSuccess: () => onOpenChange(false),
  });

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
      resetError();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new time slot for your visit with {appointment.doctorName}.
          </DialogDescription>
        </DialogHeader>

        <RescheduleAppointmentForm
          form={form}
          error={error}
          isPending={isPending}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
