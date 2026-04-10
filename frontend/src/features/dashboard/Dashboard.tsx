import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  Calendar,
  FileText,
  Heart,
  LayoutDashboard,
  Link,
  LogOut,
  Search,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";

// --- Static scaffold data ---

const stats = [
  {
    title: "Total Patients",
    value: "1,284",
    change: "+12 this week",
    icon: Users,
  },
  {
    title: "Today's Appointments",
    value: "12",
    change: "3 remaining",
    icon: Calendar,
  },
  {
    title: "Pending Lab Reports",
    value: "7",
    change: "2 urgent",
    icon: FileText,
  },
  {
    title: "Active Doctors",
    value: "48",
    change: "6 on duty now",
    icon: Stethoscope,
  },
];

const recentAppointments = [
  {
    id: 1,
    patient: "Sarah Johnson",
    doctor: "Dr. Michael Chen",
    time: "09:00 AM",
    type: "Video",
    status: "Scheduled",
  },
  {
    id: 2,
    patient: "Robert Williams",
    doctor: "Dr. Emily Davis",
    time: "10:30 AM",
    type: "In-Person",
    status: "Completed",
  },
  {
    id: 3,
    patient: "Maria Garcia",
    doctor: "Dr. James Wilson",
    time: "11:00 AM",
    type: "Video",
    status: "Scheduled",
  },
  {
    id: 4,
    patient: "David Thompson",
    doctor: "Dr. Lisa Anderson",
    time: "02:00 PM",
    type: "In-Person",
    status: "Cancelled",
  },
  {
    id: 5,
    patient: "Jennifer Martinez",
    doctor: "Dr. Michael Chen",
    time: "03:30 PM",
    type: "Video",
    status: "Scheduled",
  },
];

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

const statusStyles: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// --- Component ---

export function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Filter the sidebar based on the current user's role!
  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(user?.role?.toLowerCase() || ""),
  );

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const userInitial = user?.firstName?.charAt(0).toUpperCase() ?? "U";

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
              key={item.label}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-sm transition-colors hover:bg-muted"
              activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
            >
              <button
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left font-medium text-sm transition-colors ${
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                key={item.label}
                type="button"
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
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

          {/* Stats cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-medium text-muted-foreground text-sm">
                    {stat.title}
                  </CardTitle>
                  <div className="rounded-lg bg-muted p-1.5">
                    <stat.icon className="size-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="font-bold text-2xl">{stat.value}</p>
                  <p className="mt-0.5 text-muted-foreground text-xs">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent appointments table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-border border-b px-6 py-4">
              <div>
                <h2 className="font-semibold">Recent Appointments</h2>
                <p className="mt-0.5 text-muted-foreground text-xs">Today's appointment schedule</p>
              </div>
              <Button size="sm" variant="outline">
                View all
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-border border-b">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Patient
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Time</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentAppointments.map((appt) => (
                    <tr
                      className="border-border border-b transition-colors last:border-0 hover:bg-muted/50"
                      key={appt.id}
                    >
                      <td className="px-6 py-3 font-medium">{appt.patient}</td>
                      <td className="px-6 py-3 text-muted-foreground">{appt.doctor}</td>
                      <td className="px-6 py-3 text-muted-foreground">{appt.time}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          {appt.type === "Video" && <Activity className="size-3.5" />}
                          {appt.type}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${statusStyles[appt.status]}`}
                        >
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
      ;
    </div>
  );
}
