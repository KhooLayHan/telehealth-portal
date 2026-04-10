import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Calendar,
  FileText,
  Heart,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { AdminDashboard } from "./roles/AdminDashboard";
import { DoctorDashboard } from "./roles/DoctorDashboard";
import { PatientDashboard } from "./roles/PatientDashboard";
import { ReceptionistDashboard } from "./roles/ReceptionistDashboard";

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
  { icon: Settings, label: "System Settings", href: "/settings", allowedRoles: ["admin"] },
];

// --- Component ---

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Filter the sidebar based on the current user's role!
  const normalizedRole = user?.role?.toLowerCase();
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(normalizedRole ?? ""),
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const userInitial = user?.firstName?.charAt(0).toUpperCase() ?? "U";

  // A helper function to render the correct content based on the role
  const renderDashboardContent = () => {
    const role = user?.role?.toLowerCase();

    switch (role) {
      case "patient":
        return <PatientDashboard />;
      case "receptionist":
        return <ReceptionistDashboard />;
      case "doctor":
        return <DoctorDashboard />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <div>Invalid Role Detected</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ── */}
      <aside className="flex w-60 shrink-0 flex-col border-border border-r bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-border border-b px-6">
          <Heart className="size-5 text-primary" />
          <span className="font-bold text-base">TeleHealth</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {visibleNavItems.map((item) => (
            <Link
              to={item.href}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className: "bg-primary text-primary-foreground hover:bg-primary",
              }}
              key={item.label}
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="border-border border-t p-3">
          <div className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-sm">{user?.firstName ?? "User"}</p>
              <p className="truncate text-muted-foreground text-xs">{user?.role ?? "Patient"}</p>
            </div>
          </div>
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-muted-foreground text-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="size-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-border border-b bg-card px-6">
          <div className="relative w-72">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9" placeholder="Search patients, appointments..." />
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost">
              <Bell className="size-4" />
            </Button>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
              {userInitial}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="font-semibold text-2xl">Good morning, {user?.firstName ?? "User"}</h1>
            <p className="mt-0.5 text-muted-foreground text-sm">
              Here's what's happening at the clinic today.
            </p>
          </div>
          {renderDashboardContent()}
        </main>
      </div>
      ;
    </div>
  );
}
