import { createRootRoute, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";
import { getMe } from "@/api/generated/users/users";
import { pickPrimaryRole } from "@/features/auth/utils/roleUtils";
import { useAuthStore } from "@/store/useAuthStore";

export const Route = createRootRoute({
  beforeLoad: async () => {
    if (useAuthStore.getState().isAuthenticated) return;
    try {
      const res = await getMe();
      const profile = res.data as unknown as {
        publicId: string;
        email: string;
        firstName: string;
        avatarUrl: string | null;
        roles: string[];
      };
      useAuthStore.getState().setAuth({
        publicId: profile.publicId,
        email: profile.email,
        firstName: profile.firstName,
        role: pickPrimaryRole(profile.roles),
        avatarUrl: profile.avatarUrl,
      });
    } catch {
      // No valid session — protected routes will redirect to login
    }
  },
  component: () => (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {/* <TanStackRouterDevtools /> */}
    </>
  ),
});
