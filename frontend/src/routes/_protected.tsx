import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuthStore } from "../store/useAuthStore";

// biome-ignore-all
export const Route = createFileRoute("/_protected")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
  notFoundComponent: () => {
    return <p>This protected page doesn't exist!</p>;
  },
});
