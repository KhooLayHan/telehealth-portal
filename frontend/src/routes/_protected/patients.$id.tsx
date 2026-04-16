import { createFileRoute } from "@tanstack/react-router";
import { DoctorPatientHistoryPage } from "@/features/doctor-patients/DoctorPatientHistoryPage";

export const Route = createFileRoute("/_protected/patients/$id")({
  component: DoctorPatientHistoryPage,
});
