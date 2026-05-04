import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Search, X } from "lucide-react";
import type { DoctorAppointmentDto } from "@/api/model/DoctorAppointmentDto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalDate, formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";
import { type StatusFilter, UseDoctorAppointmentPage } from "./UseDoctorAppointmentPage";

const ACCENT = "#0d9488";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Booked", value: "booked" },
  { label: "Checked In", value: "checked-in" },
  { label: "In Progress", value: "in-progress" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

function ViewCell({ row }: { row: { original: DoctorAppointmentDto } }) {
  const navigate = useNavigate();
  const status = row.original.status ?? "";
  const canView = status === "In Progress" || status === "Completed";

  if (!canView) return <span className="text-muted-foreground/40 text-xs">—</span>;

  return (
    <Button
      size="sm"
      className="h-7 px-3 text-xs bg-[#0d9488] text-white hover:bg-[#0b857a]"
      onClick={() =>
        navigate({ to: "/appointments/$id", params: { id: row.original.publicId ?? "" } })
      }
    >
      View
    </Button>
  );
}

const columns: ColumnDef<DoctorAppointmentDto>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <span className="text-foreground">{formatLocalDate(String(row.original.date ?? ""))}</span>
    ),
  },
  {
    accessorKey: "startTime",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-medium text-foreground">
        {formatLocalTime(row.original.startTime)} – {formatLocalTime(row.original.endTime)}
      </span>
    ),
  },
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ getValue }) => <span className="font-medium">{(getValue() as string) ?? "—"}</span>,
  },
  {
    accessorKey: "visitReason",
    header: "Visit Reason",
    cell: ({ getValue }) => (
      <span className="text-muted-foreground text-sm line-clamp-1 max-w-52">
        {(getValue() as string) ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const color = row.original.statusColorCode;
      return (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
          style={{
            borderColor: color ?? undefined,
            color: color ?? undefined,
            backgroundColor: color ? `${color}12` : undefined,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: color ?? undefined }}
          />
          {row.original.status ?? "—"}
        </span>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ViewCell row={row} />,
  },
];

export function DoctorAppointmentPage() {
  const {
    items,
    totalCount,
    totalPages,
    page,
    search,
    statusFilter,
    todayOnly,
    isLoading,
    isError,
    setPage,
    handleSearchChange,
    handleStatusChange,
    handleTodayToggle,
  } = UseDoctorAppointmentPage();

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: totalCount,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />

        {/* Header */}
        <div className="flex items-end justify-between px-6 pt-6 pb-4">
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
              style={{ color: ACCENT }}
            >
              Appointments
            </p>
            <h1 className="text-2xl font-semibold tracking-tight leading-none">
              {todayOnly ? "Today's Schedule" : "All Appointments"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && !isError && (
              <span className="font-mono text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
                {totalCount} {totalCount === 1 ? "appointment" : "appointments"}
              </span>
            )}
            <Button
              size="sm"
              variant={todayOnly ? "default" : "outline"}
              className={
                todayOnly
                  ? "bg-[#0d9488] text-white hover:bg-[#0b857a] h-8 px-3 text-xs"
                  : "h-8 px-3 text-xs border-border text-muted-foreground hover:text-foreground"
              }
              onClick={handleTodayToggle}
            >
              <CalendarDays className="size-3.5 mr-1.5" />
              Today's Schedule
            </Button>
          </div>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex items-center justify-between px-6 py-4 gap-4">
          {/* Status tabs */}
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleStatusChange(tab.value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === tab.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search patient or reason..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <Separator />

        {/* Table */}
        <div className="px-6 py-4">
          {isError ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-destructive">Failed to load appointments.</p>
            </div>
          ) : (
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
                        className="text-background/70 font-semibold px-4 py-3 text-[11px] tracking-[0.15em] uppercase"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((key) => (
                      <TableRow key={key}>
                        {["date", "time", "patient", "reason", "status", "action"].map((col) => (
                          <TableCell key={`${key}-${col}`} className="px-4 py-3">
                            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-40 text-center">
                        <p className="text-sm text-muted-foreground">No appointments found.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Try adjusting your search or filter.
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-4 py-3 text-sm">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <Separator />
            <div className="flex items-center justify-between px-6 py-3 text-sm text-muted-foreground">
              <span>
                Page {page} of {totalPages} &nbsp;·&nbsp; {totalCount} total
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="border-border hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="border-border hover:bg-[#0d9488] hover:text-white hover:border-[#0d9488] disabled:hover:bg-transparent disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
