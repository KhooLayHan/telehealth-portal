import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-base-200 font-sans">
      {/* Your Top Navbar goes here */}
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={true}/>
    </div>
  ),
});
