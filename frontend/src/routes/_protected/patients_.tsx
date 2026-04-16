import { createFileRoute } from "@tanstack/react-router";

import { PatientsListingPage } from "@/features/patients/PatientsPage";

export const Route = createFileRoute("/_protected/patients_")({
  component: PatientsListingPage,
});
