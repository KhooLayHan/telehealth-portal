import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminPatientsPage } from "@/features/admins/AdminPatientsPage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/admin-patients")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminPatientsPage,
});
