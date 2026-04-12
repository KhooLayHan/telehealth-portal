import { createFileRoute } from "@tanstack/react-router";

import { AppointmentsPage } from "@/features/appointments/AppointmentsPage";

export const Route = createFileRoute("/_protected/appointments_")({
  component: AppointmentsPage,
});
