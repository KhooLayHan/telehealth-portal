import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { Eye, Pencil } from "lucide-react";
import { useGetAllAppointments } from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDto } from "@/api/src/api/model/ReceptionistAppointmentDto";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "../components/DataTable";

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

export function ReceptionistApptPage() {
  const { data, isLoading, isError } = useGetAllAppointments();

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
