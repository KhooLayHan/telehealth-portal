import { createColumnHelper } from "@tanstack/react-table";
import { Calendar, Clock } from "lucide-react";

import type { AppointmentDto } from "@/api/model/AppointmentDto";

const columnHelper = createColumnHelper<AppointmentDto>();

export const appointmentsColumns = [
  columnHelper.accessor("doctorName", {
    header: "Doctor",
    cell: (info) => {
      const name = info.getValue() ?? "Unknown";
      const initial = name.split(" ").at(-1)?.charAt(0) ?? "?";
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
            {initial}
          </div>
          <div>
            <div className="font-medium text-sm">{name}</div>
            <div className="text-xs text-muted-foreground">{info.row.original.specialization}</div>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => (
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="size-4 text-muted-foreground" />
        <span>{info.getValue() ?? "—"}</span>
      </div>
    ),
  }),
  columnHelper.accessor("startTime", {
    header: "Time",
    cell: (info) => (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="size-4 text-muted-foreground" />
        <span>{String(info.getValue() ?? "—")}</span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
        style={{
          backgroundColor: info.row.original.statusColorCode ?? "#6B7280",
        }}
      >
        {info.getValue() ?? "Unknown"}
      </span>
    ),
  }),
  columnHelper.accessor("visitReason", {
    header: "Reason",
    cell: (info) => {
      const reason = info.getValue() ?? "—";
      return (
        <span
          className="truncate max-w-37.5 inline-block text-sm text-muted-foreground"
          title={reason}
        >
          {reason}
        </span>
      );
    },
  }),
];
