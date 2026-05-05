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
import { useAdminGetAuditLogs, useAdminGetDashboardSummary } from "@/api/generated/admins/admins";
import type { AdminAuditLogDto } from "@/api/model/AdminAuditLogDto";
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

// Sets the polling cadence for server-backed admin dashboard data.
const ADMIN_DASHBOARD_REFETCH_INTERVAL_MS = 1_000;

// Describes one aggregate card shown at the top of the admin dashboard.
type AdminDashboardStat = {
  icon: LucideIcon;
  title: string;
  value?: number;
};

// Maps audit actions to badge styling variants.
function getAuditActionVariant(action: string): "default" | "outline" | "secondary" {
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

// Converts generated numeric DTO values into plain numbers for dashboard display.
function toOptionalNumber(value?: number | string): number | undefined {
  return value === undefined ? undefined : Number(value);
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

// Builds a privacy-safe actor label for audit rows.
function getAuditActorLabel(entry: AdminAuditLogDto): string {
  if (entry.performedBySystem) {
    return "System";
  }

  return entry.performedByUserPublicId === null
    ? "Unknown"
    : `User ${formatAuditPublicId(entry.performedByUserPublicId)}`;
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

// Defines the visible columns for the audit log table.
const auditLogColumns: ColumnDef<AdminAuditLogDto>[] = [
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
        <p className="font-mono text-muted-foreground text-xs">
          {formatAuditPublicId(row.original.publicId)}
        </p>
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
    accessorKey: "summary",
    header: "Details",
    cell: ({ row }) => (
      <div className="max-w-56 space-y-1">
        <p className="truncate text-sm">{row.original.summary}</p>
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

// Describes the data and loading state for the audit log table.
interface AuditLogsTableProps {
  data: AdminAuditLogDto[];
  isError: boolean;
  isLoading: boolean;
}

// Displays the backend audit log feed for system activity.
function AuditLogsTable({ data, isError, isLoading }: AuditLogsTableProps) {
  const table = useReactTable({
    data,
    columns: auditLogColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.publicId,
  });
  const message = isLoading
    ? "Loading audit logs"
    : isError
      ? "Audit logs unavailable"
      : "No audit logs found";

  return (
    <div className="overflow-x-auto rounded-md border">
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
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center text-muted-foreground" colSpan={6}>
                {message}
              </TableCell>
            </TableRow>
          )}
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
  const dashboardSummaryQuery = useAdminGetDashboardSummary({
    query: { refetchInterval: ADMIN_DASHBOARD_REFETCH_INTERVAL_MS },
  });
  const auditLogsQuery = useAdminGetAuditLogs(
    { Page: 1, PageSize: 5 },
    { query: { refetchInterval: ADMIN_DASHBOARD_REFETCH_INTERVAL_MS } },
  );
  const dashboardSummary =
    dashboardSummaryQuery.data?.status === 200 ? dashboardSummaryQuery.data.data : null;
  const auditLogs = auditLogsQuery.data?.status === 200 ? auditLogsQuery.data.data.items : [];
  const auditLogsUnavailable =
    auditLogsQuery.isError ||
    (auditLogsQuery.data !== undefined && auditLogsQuery.data.status !== 200);
  const stats: AdminDashboardStat[] = [
    {
      title: "Today's Appointments",
      value: toOptionalNumber(dashboardSummary?.todayAppointments),
      icon: CalendarDays,
    },
    {
      title: "Patients",
      value: toOptionalNumber(dashboardSummary?.patients),
      icon: Users,
    },
    {
      title: "Doctors",
      value: toOptionalNumber(dashboardSummary?.doctors),
      icon: Stethoscope,
    },
    {
      title: "Staff",
      value: toOptionalNumber(dashboardSummary?.staff),
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

        {/* Recent System Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">System Audit Logs</CardTitle>
            <CardDescription>Latest backend audit records</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogsTable
              data={auditLogs}
              isError={auditLogsUnavailable}
              isLoading={auditLogsQuery.isLoading}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
