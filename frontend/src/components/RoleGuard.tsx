import type { ReactNode } from "react";
import { useAuthStore } from "@/store/useAuthStore";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const role = useAuthStore((state) => state.user?.role?.toLowerCase());

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
