import { createFileRoute, redirect } from "@tanstack/react-router";

import { useAuthStore } from "@/store/useAuthStore";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    throw redirect({
      to: isAuthenticated ? "/dashboard" : "/login",
    });
  },
  component: () => null,
});
