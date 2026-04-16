import { createFileRoute } from "@tanstack/react-router";

import { AppointmentsPage } from "@/features/appointments/AppointmentsPage";

export const Route = createFileRoute("/_protected/appointments_")({
  validateSearch: (search: Record<string, unknown>) => ({
    today: search.today === "true" || search.today === true || undefined,
  }),
  component: AppointmentsPage,
});
