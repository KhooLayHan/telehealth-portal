import { useState } from "react";
import type { AppointmentDto } from "@/api/model/AppointmentDto";
import { AppointmentActionsDropdown } from "./AppointmentActionsDropdown";
import { CancelDialog } from "./CancelDialog";
import { RescheduleDialog } from "./RescheduleDialog";

type AppointmentActionsProps = {
  appointment: AppointmentDto;
};

export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const isActionable = appointment.status?.toLowerCase() === "booked";

  if (!isActionable) {
    return null;
  }

  return (
    <>
      <AppointmentActionsDropdown
        appointment={appointment}
        onReschedule={() => setIsRescheduleOpen(true)}
        onCancel={() => setIsCancelOpen(true)}
      />

      <CancelDialog
        appointment={appointment}
        isOpen={isCancelOpen}
        onOpenChange={setIsCancelOpen}
      />

      <RescheduleDialog
        appointment={appointment}
        isOpen={isRescheduleOpen}
        onOpenChange={setIsRescheduleOpen}
      />
    </>
  );
}
