import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AlertCircle, CheckCircle, ChevronRight, FileUp, Microscope } from "lucide-react";
import { useGetAllLabReports } from "@/api/generated/lab-reports/lab-reports";
import type { LabReportDto } from "@/api/model/LabReportDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatDate(iso: unknown): string {
  return new Date(String(iso)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const columns: ColumnDef<LabReportDto>[] = [
  {
    accessorKey: "patientFullName",
    header: "Patient",
    cell: ({ row }) => <span className="font-medium">{row.getValue("patientFullName")}</span>,
  },
  {
    accessorKey: "reportType",
    header: "Report Type",
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("reportType")}</span>,
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const { name, colorCode } = row.original.status;
      return (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          style={{
            borderColor: colorCode ?? undefined,
            color: colorCode ?? undefined,
            backgroundColor: colorCode ? `${colorCode}12` : undefined,
          }}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: colorCode ?? undefined }}
          />
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
];

function LabOrdersTable() {
  const { data, isLoading } = useGetAllLabReports({
    PageSize: 5,
    SortOrder: "desc",
  });

  const reports = data?.status === 200 ? (data.data.items ?? []) : [];

  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-2 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    );
  }

  const rows = table.getRowModel().rows;

  return (
    <>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-foreground hover:bg-foreground border-b border-foreground/20"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-5 py-3.5 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">No lab reports found.</p>
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Uploaded reports will appear here.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-border px-5 py-3">
        <Link
          to="/lab-reports"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View all lab reports
          <ChevronRight className="size-3" />
        </Link>
      </div>
    </>
  );
}

export function LabTechDashboard() {
  const { data: pendingData } = useGetAllLabReports({
    Status: "pending",
    PageSize: 1,
  });

  const pendingCount = pendingData?.status === 200 ? (pendingData.data.totalCount ?? 0) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Pending Lab Requests
            </CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Processed Today
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">18</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Equipment Status
            </CardTitle>
            <Microscope className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-xl text-green-600">Online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lab Orders Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-lg">Lab Orders</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Most recent lab reports across all statuses.
            </p>
          </div>
          <LabOrdersTable />
        </div>

        {/* Upload Widget — unchanged */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">Upload Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <FileUp className="mb-2 size-8 text-muted-foreground" />
              <p className="font-medium text-sm">Drag & Drop PDF here</p>
              <p className="mb-4 text-muted-foreground text-xs">Max size: 10MB</p>
              <Button size="sm" variant="secondary">
                Browse Files
              </Button>
            </div>
            <p className="text-center text-muted-foreground text-xs">
              * This will fetch a Pre-Signed URL and upload directly to AWS S3.
            </p>
            <Button className="w-full">Submit Results</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
