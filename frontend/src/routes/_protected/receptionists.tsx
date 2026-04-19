import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/receptionists")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <div>Admin Receptionist List Here!</div>,
});
