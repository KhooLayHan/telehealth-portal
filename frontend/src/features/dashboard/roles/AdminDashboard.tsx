import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Activity,
  CalendarDays,
  type LucideIcon,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
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
import { useAdminGetDashboardSummary } from "@/api/generated/admins/admins";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Represents mock appointment counts for the admin dashboard clinic activity chart.
type ClinicActivityDataPoint = {
  label: string;
  appointments: number;
};

// Represents a demo row shaped after the current audit_logs database table.
type AuditLogEntry = {
  publicId: string;
  tableName: string;
  recordId: number;
  action: "INSERT" | "UPDATE" | "DELETE";
  changedColumns: string[] | null;
  metadataSummary: string | null;
  performedByUserId: number | null;
  performedBySystem: boolean;
  createdAt: string;
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

// Provides local audit log rows until the admin audit endpoint is connected.
const auditLogData: AuditLogEntry[] = [
  {
    publicId: "018f9d9d-9f64-72e7-97a3-2d29f860f0a1",
    tableName: "appointments",
    recordId: 1842,
    action: "UPDATE",
    changedColumns: ["status_id", "updated_at"],
    metadataSummary: "Status moved to Completed",
    performedByUserId: 12,
    performedBySystem: false,
    createdAt: "2026-04-29T09:42:00+08:00",
  },
  {
    publicId: "018f9d9e-4627-7a62-9b24-62d11e0bdf23",
    tableName: "lab_reports",
    recordId: 927,
    action: "INSERT",
    changedColumns: null,
    metadataSummary: "Report metadata created",
    performedByUserId: null,
    performedBySystem: true,
    createdAt: "2026-04-29T09:18:00+08:00",
  },
  {
    publicId: "018f9d9f-018a-7b92-8e19-c4b458bc3899",
    tableName: "doctor_schedules",
    recordId: 311,
    action: "UPDATE",
    changedColumns: ["status_id", "updated_at"],
    metadataSummary: "Schedule slot blocked",
    performedByUserId: 7,
    performedBySystem: false,
    createdAt: "2026-04-29T08:55:00+08:00",
  },
  {
    publicId: "018f9da0-1b0c-78b7-8c1f-6b8cf5ac16ed",
    tableName: "prescriptions",
    recordId: 574,
    action: "DELETE",
    changedColumns: null,
    metadataSummary: "Soft delete captured by trigger",
    performedByUserId: 24,
    performedBySystem: false,
    createdAt: "2026-04-28T17:36:00+08:00",
  },
  {
    publicId: "018f9da1-3f58-775f-a2a4-1b3394252cb1",
    tableName: "users",
    recordId: 148,
    action: "UPDATE",
    changedColumns: ["avatar_url", "updated_at"],
    metadataSummary: "Profile asset refreshed",
    performedByUserId: 148,
    performedBySystem: false,
    createdAt: "2026-04-28T16:12:00+08:00",
  },
];

// Describes one aggregate card shown at the top of the admin dashboard.
type AdminDashboardStat = {
  icon: LucideIcon;
  title: string;
  value?: number;
};

// Maps audit actions to badge styling variants.
function getAuditActionVariant(
  action: AuditLogEntry["action"],
): "default" | "outline" | "secondary" {
  if (action === "INSERT") {
    return "default";
  }

  if (action === "DELETE") {
    return "outline";
  }

  return "secondary";
}

// Formats dashboard counts with thousands separators.
function formatDashboardCount(value?: number): string {
  return value === undefined ? "--" : value.toLocaleString();
}

// Formats audit timestamps in a compact date and time label.
function formatAuditTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleString("en-MY", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

// Builds a privacy-safe actor label for demo audit rows.
function getAuditActorLabel(entry: AuditLogEntry): string {
  if (entry.performedBySystem) {
    return "System";
  }

  return entry.performedByUserId === null ? "Unknown" : `User #${entry.performedByUserId}`;
}

// Shortens a public ID for compact trace display in the audit table.
function formatAuditPublicId(publicId: string): string {
  return publicId.slice(0, 8);
}

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

// Defines the visible columns for the audit log demo table.
const auditLogColumns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant={getAuditActionVariant(row.original.action)}>{row.original.action}</Badge>
    ),
  },
  {
    accessorKey: "tableName",
    header: "Table",
    cell: ({ row }) => (
      <div className="space-y-1">
        <p className="font-medium">{row.original.tableName}</p>
        <p className="font-mono text-muted-foreground text-xs">#{row.original.recordId}</p>
      </div>
    ),
  },
  {
    id: "actor",
    header: "Actor",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">{getAuditActorLabel(row.original)}</span>
    ),
  },
  {
    accessorKey: "changedColumns",
    header: "Changed",
    cell: ({ row }) => {
      const changedColumns = row.original.changedColumns;

      if (!changedColumns?.length) {
        return <span className="text-muted-foreground text-sm">Full row</span>;
      }

      return (
        <div className="flex max-w-48 flex-wrap gap-1.5">
          {changedColumns.map((column) => (
            <Badge key={column} variant="outline">
              {column}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "metadataSummary",
    header: "Details",
    cell: ({ row }) => (
      <div className="max-w-56 space-y-1">
        <p className="truncate text-sm">{row.original.metadataSummary ?? "No metadata"}</p>
        <p className="truncate font-mono text-muted-foreground text-xs">
          {formatAuditPublicId(row.original.publicId)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="font-mono text-muted-foreground text-xs">
        {formatAuditTimestamp(row.original.createdAt)}
      </span>
    ),
  },
];

// Displays the local TanStack Table preview for system audit logs.
function AuditLogsTable() {
  const table = useReactTable({
    data: auditLogData,
    columns: auditLogColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table className="min-w-[52rem]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Displays one aggregate count card for the admin dashboard.
function AdminDashboardStatCard({
  icon: Icon,
  isError,
  isLoading,
  title,
  value,
}: AdminDashboardStat & { isError: boolean; isLoading: boolean }) {
  const displayValue = isLoading
    ? "Loading"
    : isError
      ? "Unavailable"
      : formatDashboardCount(value);
  const valueClassName =
    isLoading || isError
      ? "font-medium text-muted-foreground text-sm"
      : "font-bold text-2xl tabular-nums";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className={valueClassName}>{displayValue}</p>
      </CardContent>
    </Card>
  );
}

export function AdminDashboard() {
  const dashboardSummaryQuery = useAdminGetDashboardSummary();
  const dashboardSummary =
    dashboardSummaryQuery.data?.status === 200 ? dashboardSummaryQuery.data.data : null;
  const stats: AdminDashboardStat[] = [
    {
      title: "Today's Appointments",
      value: dashboardSummary?.todayAppointments,
      icon: CalendarDays,
    },
    {
      title: "Patients",
      value: dashboardSummary?.patients,
      icon: Users,
    },
    {
      title: "Doctors",
      value: dashboardSummary?.doctors,
      icon: Stethoscope,
    },
    {
      title: "Staff",
      value: dashboardSummary?.staff,
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <AdminDashboardStatCard
            key={stat.title}
            {...stat}
            isError={dashboardSummaryQuery.isError || dashboardSummaryQuery.data?.status !== 200}
            isLoading={dashboardSummaryQuery.isLoading}
          />
        ))}
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
            <CardDescription>Demo data shaped from the audit_logs schema</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogsTable />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
