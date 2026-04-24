import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Microscope,
  Search,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useGetAllLabReports } from "@/api/generated/lab-reports/lab-reports";
import type { LabReportDto } from "@/api/model/LabReportDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACCENT = "#0d9488";
const LAB_STATUSES = [
  { slug: "pending", name: "Pending Upload", colorCode: "#6B7280" },
  { slug: "processing", name: "Processing", colorCode: "#F59E0B" },
  { slug: "completed", name: "Completed", colorCode: "#10B981" },
  { slug: "rejected", name: "Rejected", colorCode: "#EF4444" },
] as const;
function formatDate(iso: unknown): string {
  if (iso == null) return "—";
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
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
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const isPending = row.original.status.slug === "pending";
      if (!isPending) {
        return <span className="text-muted-foreground text-xs">—</span>;
      }
      return (
        <Link
          to="/lab-reports"
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary/5"
        >
          <Upload className="size-3" />
          Upload
        </Link>
      );
    },
  },
];
function LabOrdersTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);
  const { data, isLoading } = useGetAllLabReports({
    Search: debouncedSearch || undefined,
    Status: statusFilter || undefined,
    PageSize: 5,
    SortOrder: "desc",
  });
  const reports = data?.status === 200 ? (data.data.items ?? []) : [];
  const table = useReactTable({
    data: reports,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  const hasFilters = !!search || !!statusFilter;
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
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-border">
        {/* Search */}
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient or report type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              aria-label="Clear search"
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
        {/* Status pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden h-9">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className="h-full px-3 text-xs font-medium transition-colors cursor-pointer capitalize"
            style={!statusFilter ? { background: ACCENT, color: "white" } : undefined}
          >
            All
          </button>
          {LAB_STATUSES.map((s) => (
            <button
              type="button"
              key={s.slug}
              onClick={() => setStatusFilter(statusFilter === s.slug ? "" : s.slug)}
              className="h-full px-3 text-xs font-medium transition-colors cursor-pointer"
              style={
                statusFilter === s.slug
                  ? { background: s.colorCode, color: "white" }
                  : { color: "var(--muted-foreground)" }
              }
            >
              {s.name}
            </button>
          ))}
        </div>
        {/* Clear */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>
      {/* Table */}
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
                    {hasFilters
                      ? "Try adjusting your filters."
                      : "Uploaded reports will appear here."}
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Footer */}
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
      {/* Lab Orders Table — full width */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-border border-b px-6 py-4">
          <h2 className="font-semibold text-lg">Lab Orders</h2>
          <p className="mt-0.5 text-muted-foreground text-xs">
            Most recent lab reports across all statuses.
          </p>
        </div>
        <LabOrdersTable />
      </div>
    </div>
  );
}
