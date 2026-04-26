import { Link, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  ClipboardList,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  User,
  UserCog,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/useAuthStore";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
    allowedRoles: ["admin", "doctor", "patient", "receptionist", "lab-tech"],
  },
  {
    icon: Calendar,
    label: "Appointments",
    href: "/appointments",
    allowedRoles: ["admin", "doctor", "patient", "receptionist"],
  },
  {
    icon: Users,
    label: "Patients List",
    href: "/patients",
    allowedRoles: ["admin", "doctor", "receptionist"],
  },
  {
    icon: Stethoscope,
    label: "Doctor Schedules",
    href: "/schedules",
    allowedRoles: ["admin", "receptionist"],
  },
  {
    icon: FileText,
    label: "Lab Reports",
    href: "/lab-reports",
    allowedRoles: ["admin", "doctor", "lab-tech", "patient"],
  },
  {
    icon: User,
    label: "Profile",
    href: "/profile",
    allowedRoles: ["doctor"],
  },
  {
    icon: UserCog,
    label: "Doctor List",
    href: "/doctors",
    allowedRoles: ["admin"],
  },
  {
    icon: Building2,
    label: "Departments",
    href: "/departments",
    allowedRoles: ["admin"],
  },
  {
    icon: ClipboardList,
    label: "Receptionist List",
    href: "/receptionists",
    allowedRoles: ["admin"],
  },
  {
    icon: Settings,
    label: "System Settings",
    href: "/settings",
    allowedRoles: ["admin"],
  },
];

function UserAvatar({ avatarUrl, initial }: { avatarUrl: string | null; initial: string }) {
  if (avatarUrl) {
    return (
      <img
        key={avatarUrl}
        src={avatarUrl}
        alt="Profile"
        className="size-8 shrink-0 rounded-full object-cover cursor-pointer"
      />
    );
  }
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs cursor-pointer">
      {initial}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const normalizedRole = user?.role?.toLowerCase();
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(normalizedRole ?? ""),
  );
  const userInitial = user?.firstName?.charAt(0).toUpperCase() ?? "U";

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="flex w-60 shrink-0 flex-col border-border border-r bg-card">
        <div className="flex h-16 items-center gap-2 border-border border-b px-6">
          <Heart className="size-5 text-primary" />
          <span className="font-bold text-base">TeleHealth</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              }}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-border border-t p-3">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <UserAvatar avatarUrl={user?.avatarUrl ?? null} initial={userInitial} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-45">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  {normalizedRole === "patient" && user?.publicId ? (
                    <DropdownMenuItem className="cursor-pointer">
                      <Link
                        to="/patients/$id/medical-profile"
                        params={{ id: user.publicId }}
                        className="flex items-center gap-1.5"
                      >
                        <User className="size-3 shrink-0" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="size-3 shrink-0" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{user?.firstName ?? "User"}</p>
              <p className="truncate text-muted-foreground text-xs">{user?.role ?? "User"}</p>
            </div>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-end border-border border-b bg-card px-6">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <UserAvatar avatarUrl={user?.avatarUrl ?? null} initial={userInitial} />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-45">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                {normalizedRole === "patient" && user?.publicId ? (
                  <DropdownMenuItem className="cursor-pointer">
                    <Link
                      to="/patients/$id/medical-profile"
                      params={{ id: user.publicId }}
                      className="flex items-center gap-1.5"
                    >
                      <User className="size-3 shrink-0" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="size-3 shrink-0" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
