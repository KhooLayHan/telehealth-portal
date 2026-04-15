import { Activity, Calendar, FileText, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientAppointmentsList } from "@/features/patients/appointments/AppointmentsList";
import { BookAppointmentForm } from "@/features/patients/book/BookAppointmentForm";
import { PatientMedicalProfileForm } from "@/features/patients/medical-profile/MedicalProfileForm";

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

const statusStyles: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function PatientDashboard() {
  return (
    <div className="space-y-6">
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
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Patient</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Doctor</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
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
      <PatientAppointmentsList />
      <PatientMedicalProfileForm />
      <BookAppointmentForm />
    </div>
  );
}
