import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDoctorsPage } from "@/features/admins/AdminDoctorsPage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/doctors")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDoctorsPage,
});
