import { useQueryClient } from "@tanstack/react-query";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdateById } from "@/api/generated/appointments/appointments";
import { getGetDailySchedulesForReceptionistQueryKey } from "@/api/generated/schedules/schedules";
import type { AppointmentStatusesDto } from "@/api/model/AppointmentStatusesDto";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

interface SlotRow {
  queueNum: number;
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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { mutateAsync } = useUpdateById();

  const currentStatus = statuses.find((s) => s.name === slot.appointmentStatus);
  if (!slot.appointmentPublicId || currentStatus?.isTerminal)
    return <span className="text-xs text-muted-foreground/50">—</span>;

  const handleUpdate = async (statusSlug: string, cancellationReason: string | null = null) => {
    if (!slot.appointmentPublicId || !slot.publicId) return;
    setPending(statusSlug);
    try {
      await mutateAsync({
        id: slot.appointmentPublicId,
        data: { statusSlug, schedulePublicId: slot.publicId, cancellationReason },
      });
      await queryClient.invalidateQueries({
        queryKey: getGetDailySchedulesForReceptionistQueryKey({ Date: today }),
      });
      const label = statuses.find((s) => s.slug === statusSlug)?.name ?? statusSlug;
      toast.success(`Status updated to ${label}`);
    } catch {
      toast.error("Failed to update status. Please try again.");
    } finally {
      setPending(null);
    }
  };

  const handleCancelConfirm = async () => {
    await handleUpdate("cancelled", cancelReason);
    setCancelOpen(false);
    setCancelReason("");
  };

  const currentSlug = statuses.find((s) => s.name === slot.appointmentStatus)?.slug ?? "";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={!!pending}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-input bg-background px-2 text-xs font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <>
              Update
              <ChevronDown className="size-3 text-muted-foreground" />
            </>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Set status</p>
          <div className="-mx-1 my-1 h-px bg-border" />
          {statuses.map((s) => (
            <DropdownMenuItem
              key={s.slug}
              disabled={s.slug === currentSlug}
              className="flex items-center gap-2 text-xs"
              onClick={() => {
                if (!s.slug) return;
                if (s.slug === "cancelled") {
                  setCancelOpen(true);
                } else {
                  handleUpdate(s.slug);
                }
              }}
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

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton={false} className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason" className="text-xs font-medium">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              placeholder="e.g. Patient requested reschedule…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="text-sm resize-none"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCancelOpen(false);
                setCancelReason("");
              }}
            >
              Back
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!cancelReason.trim() || !!pending}
              onClick={handleCancelConfirm}
            >
              {pending === "cancelled" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ScheduleQueueTable({ rows, statuses, isLoading, today }: ScheduleQueueTableProps) {
  const columns: ColumnDef<SlotRow>[] = [
    {
      id: "queue",
      header: "#",
      cell: ({ row }) => (
        <span
          className="inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: "#0d9488" }}
        >
          {row.original.queueNum}
        </span>
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
      id: "apptStatus",
      header: "Status",
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
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const SKELETON_ROWS = ["a", "b", "c", "d", "e"];
  const SKELETON_COLS = ["q", "t", "p", "d", "r", "ss", "as", "ac"];

  return (
    <div>
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
                  No appointments scheduled for today.
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
