import { createFileRoute } from "@tanstack/react-router";
import { DoctorProfilePage } from "@/features/profile/DoctorProfilePage";
import { ReceptionistProfilePage } from "@/features/profile/ReceptionistProfilePage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const role = useAuthStore((s) => s.user?.role);
  if (role === "receptionist") return <ReceptionistProfilePage />;
  return <DoctorProfilePage />;
}
