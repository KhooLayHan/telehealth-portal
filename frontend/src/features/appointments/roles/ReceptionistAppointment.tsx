import { Link } from "@tanstack/react-router";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Eye, Pencil, Search } from "lucide-react";
import { useState } from "react";
import { useGetAllAppointmentsForReceptionist } from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
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

const ACCENT = "#0d9488";

const columns: ColumnDef<ReceptionistAppointmentDto>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => <span className="font-medium">{row.getValue("patientName")}</span>,
  },
  {
    accessorKey: "specialization",
    header: "Specialization",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.getValue("specialization")}</span>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => <span className="font-mono text-xs">{String(row.getValue("date"))}</span>,
  },
  {
    accessorKey: "startTime",
    header: "Time",
    cell: ({ row }) => (
      <span className="font-mono text-xs">
        {String(row.getValue("startTime"))} – {String(row.original.endTime)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<string>("status");
      const colorCode = row.original.statusColorCode;
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
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: colorCode ?? undefined }}
          />
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "visitReason",
    header: "Visit Reason",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs line-clamp-1 max-w-48">
        {row.getValue("visitReason")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <Link
          to="/appointments/$id"
          params={{ id: row.original.publicId ?? "" }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Eye className="size-3.5" />
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={() => console.log("Edit", row.original.publicId)}
        >
          <Pencil className="size-3.5" />
        </Button>
      </div>
    ),
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="relative w-72">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search appointments…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
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
                    className="text-background/70 font-semibold px-5 py-3.5 text-[11px] tracking-[0.15em] uppercase"
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
              rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                  style={{ animationDelay: `${i * 30}ms` }}
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
                  <p className="text-sm text-muted-foreground">No appointments found.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Try adjusting your search.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ReceptionistApptPage() {
  const { data, isLoading, isError } = useGetAllAppointmentsForReceptionist();

  const appointments = data?.status === 200 ? data.data.items : [];
  const totalCount = data?.status === 200 ? data.data.totalCount : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />

        {/* Card header */}
        <div className="flex items-end justify-between px-6 pt-6 pb-4">
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
              style={{ color: ACCENT }}
            >
              Appointments
            </p>
            <h1 className="text-2xl font-semibold tracking-tight leading-none">All Appointments</h1>
          </div>

          {!isLoading && !isError && (
            <span className="font-mono text-xs text-muted-foreground border border-border rounded-full px-3 py-1">
              {totalCount} total
            </span>
          )}
        </div>

        <Separator />

        {/* Card content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-muted-foreground tracking-wide">Loading appointments…</p>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-sm text-destructive">Failed to load appointments.</p>
            </div>
          ) : (
            <DataTable columns={columns} data={appointments ?? []} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
