import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminLabTechsPage } from "@/features/admins/AdminLabTechsPage";
import { useAuthStore } from "@/store/useAuthStore";

// Defines the protected admin lab technician directory route.
export const Route = createFileRoute("/_protected/lab-techs")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminLabTechsPage,
});
