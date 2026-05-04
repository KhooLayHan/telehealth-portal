import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AdminProfilePage } from "@/features/profile/AdminProfilePage";
import { DoctorProfilePage } from "@/features/profile/DoctorProfilePage";
import { ReceptionistProfilePage } from "@/features/profile/ReceptionistProfilePage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.user?.role?.toLowerCase());

  if (!role) return null;
  if (role === "patient" && user?.publicId)
    return <Navigate to="/patients/$id/medical-profile" params={{ id: user.publicId }} />;
  if (role === "admin") return <AdminProfilePage />;
  if (role === "receptionist") return <ReceptionistProfilePage />;
  return <DoctorProfilePage />;
}
