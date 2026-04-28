import { Activity, CalendarDays, ShieldCheck, Stethoscope, Users } from "lucide-react";
import type { TooltipContentProps, TooltipValueType } from "recharts";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Represents mock appointment counts for the admin dashboard clinic activity chart.
type ClinicActivityDataPoint = {
  label: string;
  appointments: number;
};

// Provides static chart data until the clinic activity endpoint is connected.
const clinicActivityData: ClinicActivityDataPoint[] = [
  { label: "Mon", appointments: 18 },
  { label: "Tue", appointments: 24 },
  { label: "Wed", appointments: 21 },
  { label: "Thu", appointments: 32 },
  { label: "Fri", appointments: 29 },
  { label: "Sat", appointments: 16 },
  { label: "Sun", appointments: 12 },
];

// Renders the tooltip content for the clinic activity chart.
function ClinicActivityTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<TooltipValueType, string | number>) {
  const appointmentCount = payload?.[0]?.value;

  if (!(active && typeof appointmentCount === "number")) {
    return null;
  }

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="font-medium text-sm">{label}</p>
      <p className="text-muted-foreground text-xs">{appointmentCount} appointments</p>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Today's Appointments
            </CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">1,204</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Doctors</CardTitle>
            <Stethoscope className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">86</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Staff</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">48</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Clinic Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="font-semibold text-lg">Clinic Activity</CardTitle>
                <CardDescription>Appointment volume over the last 7 days</CardDescription>
              </div>
              <Activity className="size-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer height="100%" width="100%">
                <AreaChart
                  data={clinicActivityData}
                  margin={{ bottom: 0, left: -20, right: 8, top: 8 }}
                >
                  <defs>
                    <linearGradient id="clinic-activity-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                    tickLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={(props) => <ClinicActivityTooltip {...props} />}
                    cursor={{ stroke: "var(--border)" }}
                  />
                  <Area
                    dataKey="appointments"
                    fill="url(#clinic-activity-fill)"
                    name="Appointments"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent System Activity Table Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">System Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Boh Chun: Insert TanStack Table for Audit Logs here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
