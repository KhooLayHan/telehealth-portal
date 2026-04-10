import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/_protected/settings")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role?.toLowerCase() !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <div>Admin System Settings Here!</div>,
});
