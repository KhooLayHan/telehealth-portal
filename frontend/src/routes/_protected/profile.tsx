import { createFileRoute } from "@tanstack/react-router";
import { DoctorProfilePage } from "@/features/profile/DoctorProfilePage";

export const Route = createFileRoute("/_protected/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  return <DoctorProfilePage />;
}
