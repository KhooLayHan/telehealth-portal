import { CalendarClock, MoreHorizontal, XCircle } from "lucide-react";
import type { AppointmentDto } from "@/api/model/AppointmentDto";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AppointmentActionsDropdownProps = {
  appointment: AppointmentDto;
  onReschedule: () => void;
  onCancel: () => void;
};

export function AppointmentActionsDropdown({
  appointment,
  onReschedule,
  onCancel,
}: AppointmentActionsDropdownProps) {
  const isActionable = appointment.status?.toLowerCase() === "booked";

  if (!isActionable) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onReschedule}>
            <CalendarClock className="mr-2 size-4" />
            Reschedule
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={onCancel}
          >
            <XCircle className="mr-2 size-4" />
            Cancel Appointment
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
