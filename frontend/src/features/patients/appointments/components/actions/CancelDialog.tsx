import type { AppointmentDto } from "@/api/model/AppointmentDto";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CancelAppointmentForm } from "../forms/CancelAppointmentForm";
import { useCancelForm } from "../hooks/useCancelForm";

type CancelDialogProps = {
  appointment: AppointmentDto;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CancelDialog({ appointment, isOpen, onOpenChange }: CancelDialogProps) {
  const { form, error, isPending, resetError } = useCancelForm({
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
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel your appointment with Dr.{" "}
            <strong>{appointment.doctorName}</strong> on {appointment.date}? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <CancelAppointmentForm
          form={form}
          error={error}
          isPending={isPending}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
