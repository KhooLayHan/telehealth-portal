import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { AppointmentDto } from "@/api/model/AppointmentDto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { appointmentsColumns } from "./AppointmentsColumns";

type AppointmentsTableProps = {
  data: AppointmentDto[];
  isLoading: boolean;
  view: string;
};

const columnCount = appointmentsColumns.length;

export function AppointmentsTable({ data, isLoading, view }: AppointmentsTableProps) {
  const table = useReactTable({
    data,
    getRowId: (row) =>
      row.publicId ?? `${row.date ?? ""}-${row.startTime ?? ""}-${row.doctorName ?? ""}`,
    columns: appointmentsColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center">
                Loading appointments...
              </TableCell>
            </TableRow>
          ) : table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                No {view} appointments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
