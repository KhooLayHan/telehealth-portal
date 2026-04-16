import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search } from "lucide-react";
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
const PAGE_SIZE = 10;

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
        <Link
          to="/appointments/edit/$id"
          params={{ id: row.original.publicId ?? "" }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </Link>
      </div>
    ),
  },
];

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

function DataTable<TData, TValue>({
  columns,
  data,
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  search,
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative w-72">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search appointments…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      {/* Table */}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasPreviousPage}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Page number buttons — show up to 5 around current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push(`ellipsis-after-${arr[idx - 1]}`);
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="text-xs text-muted-foreground px-1">
                    …
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    style={item === page ? { background: ACCENT } : undefined}
                    onClick={() => onPageChange(item)}
                  >
                    {item}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!hasNextPage}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ReceptionistApptPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGetAllAppointmentsForReceptionist({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
  });

  const result = data?.status === 200 ? data.data : null;
  const appointments = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

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
            <DataTable
              columns={columns}
              data={appointments}
              page={page}
              totalPages={totalPages}
              hasNextPage={result?.hasNextPage}
              hasPreviousPage={result?.hasPreviousPage}
              onPageChange={setPage}
              search={search}
              onSearchChange={handleSearchChange}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
