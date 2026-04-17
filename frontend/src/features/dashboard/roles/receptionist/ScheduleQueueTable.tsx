import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { useUpdateById } from "@/api/generated/appointments/appointments";
import { getGetDailySchedulesForReceptionistQueryKey } from "@/api/generated/schedules/schedules";
import type { AppointmentStatusesDto } from "@/api/model/AppointmentStatusesDto";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

interface SlotRow {
  queueNum: number | null;
  slot: ReceptionistDoctorScheduleSlotDto;
}

interface ScheduleQueueTableProps {
  rows: SlotRow[];
  statuses: AppointmentStatusesDto[];
  isLoading: boolean;
  today: string;
}

function StatusActionCell({
  slot,
  statuses,
  today,
}: {
  slot: ReceptionistDoctorScheduleSlotDto;
  statuses: AppointmentStatusesDto[];
  today: string;
}) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const { mutateAsync } = useUpdateById();

  if (!slot.appointmentPublicId) return <span className="text-xs text-muted-foreground/50">—</span>;

  const handleUpdate = async (statusSlug: string) => {
    if (!slot.appointmentPublicId || !slot.publicId) return;
    setPending(statusSlug);
    try {
      await mutateAsync({
        id: slot.appointmentPublicId,
        data: {
          statusSlug,
          schedulePublicId: slot.publicId,
          cancellationReason: null,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetDailySchedulesForReceptionistQueryKey({ Date: today }),
      });
    } finally {
      setPending(null);
    }
  };

  const currentSlug = statuses.find((s) => s.name === slot.appointmentStatus)?.slug ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" disabled={!!pending}>
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <>
              Update
              <ChevronDown className="size-3 text-muted-foreground" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-xs">Set status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {statuses.map((s) => (
          <DropdownMenuItem
            key={s.slug}
            disabled={s.slug === currentSlug}
            className="flex items-center gap-2 text-xs"
            onClick={() => s.slug && handleUpdate(s.slug)}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ background: s.colorCode ?? "#94a3b8" }}
            />
            {s.name}
            {s.slug === currentSlug && (
              <span className="ml-auto text-[10px] text-muted-foreground">current</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ScheduleQueueTable({ rows, statuses, isLoading, today }: ScheduleQueueTableProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? rows.filter(({ slot }) => {
        const q = search.toLowerCase();
        return (
          slot.patientName?.toLowerCase().includes(q) ||
          slot.doctorName?.toLowerCase().includes(q) ||
          slot.visitReason?.toLowerCase().includes(q) ||
          slot.doctorSpecialization?.toLowerCase().includes(q)
        );
      })
    : rows;

  const columns: ColumnDef<SlotRow>[] = [
    {
      id: "queue",
      header: "#",
      cell: ({ row }) =>
        row.original.queueNum !== null ? (
          <span
            className="inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "#0d9488" }}
          >
            {row.original.queueNum}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        ),
    },
    {
      id: "time",
      header: "Time",
      cell: ({ row }) => {
        const s = row.original.slot;
        return (
          <span className="font-mono text-xs font-semibold">
            {formatLocalTime(String(s.startTime))} – {formatLocalTime(String(s.endTime))}
          </span>
        );
      },
    },
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const s = row.original.slot;
        return s.patientName ? (
          <span className="text-xs font-medium">{s.patientName}</span>
        ) : (
          <span className="text-xs italic text-muted-foreground/50">Available</span>
        );
      },
    },
    {
      id: "doctor",
      header: "Doctor",
      cell: ({ row }) => {
        const s = row.original.slot;
        return (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{s.doctorName}</p>
            {s.doctorSpecialization && (
              <p className="truncate text-[10px] text-muted-foreground">{s.doctorSpecialization}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "visitReason",
      header: "Visit Reason",
      cell: ({ row }) => {
        const s = row.original.slot;
        return <span className="text-xs text-muted-foreground">{s.visitReason ?? "—"}</span>;
      },
    },
    {
      id: "scheduleStatus",
      header: "Slot",
      cell: ({ row }) => {
        const s = row.original.slot;
        const c = s.scheduleStatusColorCode ?? "#94a3b8";
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none"
            style={{ borderColor: `${c}55`, color: c, backgroundColor: `${c}12` }}
          >
            <span className="size-1.5 rounded-full shrink-0" style={{ background: c }} />
            {s.scheduleStatus ?? "—"}
          </span>
        );
      },
    },
    {
      id: "apptStatus",
      header: "Appointment",
      cell: ({ row }) => {
        const s = row.original.slot;
        if (!s.appointmentStatus)
          return <span className="text-xs text-muted-foreground/40">—</span>;
        const c = s.appointmentStatusColorCode ?? "#94a3b8";
        return (
          <Badge
            className="text-[10px]"
            style={{ backgroundColor: c, color: "#fff", borderColor: "transparent" }}
          >
            {s.appointmentStatus}
          </Badge>
        );
      },
    },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <StatusActionCell slot={row.original.slot} statuses={statuses} today={today} />
      ),
    },
  ];

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const SKELETON_ROWS = ["a", "b", "c", "d", "e"];
  const SKELETON_COLS = ["q", "t", "p", "d", "r", "ss", "as", "ac"];

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-8 pl-8 pr-8 text-xs"
          placeholder="Search patient, doctor, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {search && (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} slots
        </p>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id} className="text-xs">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">
            {isLoading ? (
              SKELETON_ROWS.map((r) => (
                <TableRow key={r}>
                  {SKELETON_COLS.map((c) => (
                    <TableCell key={`${r}-${c}`}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-sm text-muted-foreground"
                >
                  {search ? "No slots match your search." : "No slots scheduled for today."}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
