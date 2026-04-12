import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";
import type { ReceptionistAppointmentDto } from "@/api/src/api/model/ReceptionistAppointmentDto";
import { Button } from "@/components/ui/button";

export const columns: ColumnDef<ReceptionistAppointmentDto>[] = [
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
