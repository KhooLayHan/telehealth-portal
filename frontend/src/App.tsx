import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter, createRootRoute, createRoute } from "@tanstack/react-router";
import { LoginForm } from "./features/auth/LoginForm"; // <-- Make sure this path matches where you saved it!

// 1. Initialize TanStack Query
const queryClient = new QueryClient();

// 2. Set up a quick Router just for testing
const rootRoute = createRootRoute();

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LoginForm,
});

const routeTree = rootRoute.addChildren([loginRoute]);
const router = createRouter({ routeTree });

// 3. The Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
