import { createFileRoute } from "@tanstack/react-router";

import { AppointmentDetailsPage } from "@/features/appointments/AppointmentDetailsPage";

export const Route = createFileRoute("/_protected/appointments/$id")({
  component: AppointmentDetailsPage,
});
