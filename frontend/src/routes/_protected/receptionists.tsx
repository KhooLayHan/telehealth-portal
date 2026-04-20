import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminReceptionistsPage } from "@/features/admins/AdminReceptionistsPage";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/receptionists")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminReceptionistsPage,
});
