import { useNavigate } from "@tanstack/react-router";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import type { DoctorAppointmentDto } from "@/api/model/DoctorAppointmentDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatLocalDate, formatLocalTime } from "./UseDoctorSchedule";

type Props = {
  items: DoctorAppointmentDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  search: string;
  isLoading: boolean;
  hidePagination?: boolean;
  onPageChange: (page: number) => void;
  onSearchChange: (search: string) => void;
};

function ActionCell({ row }: { row: { original: DoctorAppointmentDto } }) {
  const navigate = useNavigate();
  const status = row.original.status ?? "";
  const canView = status === "Booked" || status === "Completed";

  if (!canView) return null;

  return (
    <Button
      size="sm"
      className="border-0 bg-[#0d9488] text-white hover:bg-[#0b857a]"
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
      <span className="text-muted-foreground">{(getValue() as string) ?? "—"}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const color = row.original.statusColorCode;
      return (
        <Badge
          style={color ? { backgroundColor: color, color: "#fff" } : undefined}
          variant={color ? undefined : "secondary"}
        >
          {row.original.status ?? "—"}
        </Badge>
      );
    },
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => <ActionCell row={row} />,
  },
];

export function DoctorScheduleTable({
  items,
  totalCount,
  page,
  pageSize,
  search,
  isLoading,
  hidePagination = false,
  onPageChange,
  onSearchChange,
}: Props) {
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    rowCount: totalCount,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search patient or reason..."
          value={search}
          onChange={(e) => {
            onSearchChange(e.target.value);
            onPageChange(1);
          }}
        />
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">
            {isLoading ? (
              ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5"].map((rowKey) => (
                <TableRow key={rowKey}>
                  {["date", "time", "patient", "reason", "status", "action"].map((colKey) => (
                    <TableCell key={`${rowKey}-${colKey}`}>
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-muted-foreground"
                >
                  No appointments for today.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border-b transition-colors last:border-0 hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </motion.tr>
              ))
            )}
          </AnimatePresence>
        </TableBody>
      </Table>

      {/* Pagination */}
      {!hidePagination && totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
