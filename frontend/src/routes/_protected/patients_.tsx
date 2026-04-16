import { createFileRoute } from "@tanstack/react-router";
import { DoctorPatientsPage } from "@/features/doctor-patients/DoctorPatientsPage";
import { PatientsListingPage } from "@/features/patients/PatientsPage";
import { useAuthStore } from "@/store/useAuthStore";

function PatientsRoute() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  if (role === "doctor") return <DoctorPatientsPage />;
  return <PatientsListingPage />;
}

export const Route = createFileRoute("/_protected/patients_")({
  component: PatientsRoute,
});
