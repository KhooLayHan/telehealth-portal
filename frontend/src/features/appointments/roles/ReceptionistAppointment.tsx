import { Link } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  BellRing,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useGetAllAppointmentsForReceptionist,
  useGetAllStatuses,
  useRemindPatient,
} from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
const TERMINAL_SLUGS = ["cancelled", "completed", "no-show"];

function ActionsCell({ row }: { row: { original: ReceptionistAppointmentDto } }) {
  const { mutateAsync: sendReminder, isPending: isSending } = useRemindPatient();
  const isTerminal = TERMINAL_SLUGS.includes(row.original.statusSlug ?? "");

  return (
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
      <button
        type="button"
        disabled={isSending || isTerminal}
        title={
          isTerminal
            ? "Cannot send reminder for completed/cancelled appointments"
            : "Send reminder email"
        }
        onClick={async () => {
          try {
            await sendReminder({ id: row.original.publicId ?? "" });
            toast.success(`Reminder sent to ${row.original.patientName}.`);
          } catch {
            toast.error("Failed to send reminder. Please try again.");
          }
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSending ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <BellRing className="size-3.5" />
        )}
      </button>
    </div>
  );
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

const columns: ColumnDef<ReceptionistAppointmentDto>[] = [
  {
    accessorKey: "patientName",
    header: "Patient",
    cell: ({ row }) => {
      const name = (row.original.patientName ?? "") as string;
      const avatarUrl = row.original.patientAvatarUrl;
      const initials = name
        .split(" ")
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join("");
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="size-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "doctorName",
    header: "Doctor",
    cell: ({ row }) => {
      const name = (row.original.doctorName ?? "") as string;
      const avatarUrl = row.original.doctorAvatarUrl;
      const initials = name
        .split(" ")
        .slice(0, 2)
        .map((n) => n.charAt(0).toUpperCase())
        .join("");
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold text-foreground">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="size-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm leading-none">{name}</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">
              {row.original.specialization}
            </span>
          </div>
        </div>
      );
    },
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
            className="h-1.5 w-1.5 shrink-0 rounded-full"
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
      <span className="line-clamp-1 max-w-48 text-xs text-muted-foreground">
        {row.getValue("visitReason")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
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
  statusFilter: string;
  onStatusChange: (value: string) => void;
  statuses: { slug?: string; name?: string; colorCode?: string }[];
  todayOnly: boolean;
  onTodayOnlyChange: (value: boolean) => void;
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
  statusFilter,
  onStatusChange,
  statuses,
  todayOnly,
  onTodayOnlyChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;
  const hasFilters = !!search || !!statusFilter || todayOnly;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-52 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient, doctor, reason…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden h-9">
          <button
            type="button"
            onClick={() => onStatusChange("")}
            className={`h-full px-3 text-xs font-medium transition-colors capitalize cursor-pointer ${
              !statusFilter
                ? "text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            style={!statusFilter ? { background: ACCENT } : {}}
          >
            All
          </button>
          {statuses.map((s) => (
            <button
              type="button"
              key={s.slug}
              onClick={() => onStatusChange(statusFilter === s.slug ? "" : (s.slug ?? ""))}
              className={`h-full px-3 text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === s.slug
                  ? "text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={statusFilter === s.slug ? { background: s.colorCode ?? ACCENT } : {}}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Today switch */}
        <div className="flex items-center gap-2 rounded-lg border border-border h-9 px-3">
          <CalendarCheck className="size-3.5 text-muted-foreground" />
          <Label htmlFor="today-switch" className="text-xs font-medium cursor-pointer select-none">
            Today only
          </Label>
          <Switch id="today-switch" checked={todayOnly} onCheckedChange={onTodayOnlyChange} />
        </div>

        {/* Clear all filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1.5 text-xs text-muted-foreground"
            onClick={() => {
              onSearchChange("");
              onStatusChange("");
              onTodayOnlyChange(false);
            }}
          >
            <X className="size-3" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border">
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
                  <p className="mt-1 text-xs text-muted-foreground/60">
                    Try adjusting your filters.
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
                  <span key={item} className="px-1 text-xs text-muted-foreground">
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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const today = getTodayStr();

  const { data, isLoading, isError } = useGetAllAppointmentsForReceptionist({
    Page: page,
    PageSize: PAGE_SIZE,
    SortOrder: "desc",
    Search: search || undefined,
    Status: statusFilter || undefined,
    From: todayOnly ? today : undefined,
    To: todayOnly ? today : undefined,
  });

  const { data: statusData } = useGetAllStatuses();
  const statuses =
    statusData?.status === 200
      ? statusData.data.map((s) => ({ slug: s.slug, name: s.name, colorCode: s.colorCode }))
      : [];

  const result = data?.status === 200 ? data.data : null;
  const appointments = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

  function handleSearchChange(value: string) {
    setSearchInput(value);
  }

  function handleStatusChange(slug: string) {
    setStatusFilter(slug);
    setPage(1);
  }

  function handleTodayOnlyChange(value: boolean) {
    setTodayOnly(value);
    setPage(1);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

        {/* Card header */}
        <div className="flex items-end justify-between px-6 pb-4 pt-6">
          <div>
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: ACCENT }}
            >
              Appointments
            </p>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">All Appointments</h1>
          </div>

          {!isLoading && !isError && (
            <span className="rounded-full border border-border px-3 py-1 font-mono text-xs text-muted-foreground">
              {totalCount} total
            </span>
          )}
        </div>

        <Separator />

        {/* Card content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm tracking-wide text-muted-foreground">Loading appointments…</p>
            </div>
          ) : isError ? (
            <div className="flex h-48 items-center justify-center">
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
              search={searchInput}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusChange={handleStatusChange}
              statuses={statuses}
              todayOnly={todayOnly}
              onTodayOnlyChange={handleTodayOnlyChange}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
