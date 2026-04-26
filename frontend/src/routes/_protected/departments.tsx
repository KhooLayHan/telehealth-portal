import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDepartmentPage } from "@/features/admins/AdminDepartmentPage";
import { useAuthStore } from "@/store/useAuthStore";

// Defines the protected admin-only departments route.
export const Route = createFileRoute("/_protected/departments")({
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();

    if (role !== "admin") {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: AdminDepartmentPage,
});
