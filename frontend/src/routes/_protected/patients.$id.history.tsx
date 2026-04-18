import { createFileRoute } from "@tanstack/react-router";
import { PatientHistoryPage } from "@/features/patients/PatientHistoryPage";

export const Route = createFileRoute("/_protected/patients/$id/history")({
  component: PatientHistoryPage,
});
