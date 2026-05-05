import { useNavigate } from "@tanstack/react-router";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { useGetAllAppointments } from "@/api/generated/patients/patients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusStyles: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PatientDashboard() {
  const navigate = useNavigate();

  const { data: upcomingData } = useGetAllAppointments({
    View: "upcoming",
    Page: 1,
    PageSize: 1,
  });
  const { data: pastData } = useGetAllAppointments({
    View: "past",
    Page: 1,
    PageSize: 1,
  });

  const upcoming = upcomingData?.status === 200 ? upcomingData.data : undefined;
  const past = pastData?.status === 200 ? pastData.data : undefined;

  const upcomingCount = Number(upcoming?.totalCount ?? 0);
  const pastCount = Number(past?.totalCount ?? 0);
  const nextAppt = upcoming?.items[0];

  const stats = [
    {
      title: "Upcoming Appointments",
      value: String(upcomingCount),
      sub: upcomingCount === 1 ? "1 scheduled" : `${upcomingCount} scheduled`,
      icon: Calendar,
      iconBg: "bg-teal-100 dark:bg-teal-900/30",
      iconColor: "text-teal-600 dark:text-teal-400",
      onClick: () => navigate({ to: "/appointments", search: { today: true } }),
    },
    {
      title: "Completed Visits",
      value: String(pastCount),
      sub: "total past visits",
      icon: CheckCircle2,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      onClick: () => navigate({ to: "/appointments", search: { today: true } }),
    },
    {
      title: "Next Appointment",
      value: nextAppt ? String(nextAppt.date) : "None",
      sub: nextAppt ? `with ${nextAppt.doctorName}` : "No upcoming visits",
      icon: Clock,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      onClick: () => navigate({ to: "/appointments", search: { today: true } }),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-1.5 ${stat.iconBg}`}>
                <stat.icon className={`size-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-2xl">{stat.value}</p>
              <p className="mt-0.5 text-muted-foreground text-xs">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Recent appointments table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-border border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Recent Appointments</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Your upcoming schedule at a glance
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/appointments", search: { today: true } })}
          >
            View all
          </Button>
        </div>

        {upcoming?.items && upcoming.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border border-b">
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Doctor</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.items.map((appt) => (
                  <tr
                    key={appt.publicId}
                    className="border-border border-b transition-colors last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-6 py-3 font-medium">{appt.doctorName}</td>
                    <td className="px-6 py-3 text-muted-foreground">{appt.specialization}</td>
                    <td className="px-6 py-3 text-muted-foreground">{String(appt.date)}</td>
                    <td className="px-6 py-3 text-muted-foreground">{String(appt.startTime)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium text-xs ${statusStyles[appt.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        {appt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Calendar className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            <Button size="sm" onClick={() => navigate({ to: "/appointments/book" })}>
              Book an Appointment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
