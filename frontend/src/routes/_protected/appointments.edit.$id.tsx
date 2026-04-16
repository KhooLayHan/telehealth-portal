import { createFileRoute } from "@tanstack/react-router";

import { EditAppointmentPage } from "@/features/appointments/EditAppointmentPage";

export const Route = createFileRoute("/_protected/appointments/edit/$id")({
  component: EditAppointmentPage,
});
