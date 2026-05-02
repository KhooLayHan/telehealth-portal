import { createFileRoute } from "@tanstack/react-router";
import { AdminProfilePage } from "@/features/profile/AdminProfilePage";
import { DoctorProfilePage } from "@/features/profile/DoctorProfilePage";
import { ReceptionistProfilePage } from "@/features/profile/ReceptionistProfilePage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const role = useAuthStore((s) => s.user?.role?.toLowerCase());

  if (role === "admin") return <AdminProfilePage />;
  if (role === "receptionist") return <ReceptionistProfilePage />;
  return <DoctorProfilePage />;
}
