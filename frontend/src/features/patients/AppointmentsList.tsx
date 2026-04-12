// src/features/appointments/PatientAppointmentsList.tsx

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Calendar, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";

// Import your generated Orval hook and DTO!
// (Adjust path based on your exact Orval output)
import { useGetAllAppointments } from "@/api/generated/patients/patients";
import type { AppointmentDto } from "@/api/model/AppointmentDto";
import { Button } from "@/components/ui/button";
// shadcn/ui components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 1. Define the Columns using TanStack Table's Column Helper
const columnHelper = createColumnHelper<AppointmentDto>();

const columns = [
  columnHelper.accessor("doctorName", {
    header: "Doctor",
    cell: (info) => (
      <div className="flex items-center gap-3">
        {/* Simple Tailwind Avatar */}
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
          {info.getValue().charAt(4)} {/* Grabs the first initial after "Dr. " */}
        </div>
        <div>
          <div className="font-medium text-sm">{info.getValue()}</div>
          <div className="text-xs text-muted-foreground">{info.row.original.specialization}</div>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("date", {
    header: "Date",
    cell: (info) => (
      <div className="flex items-center gap-2 text-sm">
        <Calendar className="size-4 text-muted-foreground" />
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("startTime", {
    header: "Time",
    cell: (info) => (
      <div className="flex items-center gap-2 text-sm">
        <Clock className="size-4 text-muted-foreground" />
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (info) => (
      // Custom pill badge using dynamic inline styles for the DB color code
      <span
        className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm"
        style={{ backgroundColor: info.row.original.statusColorCode || "#6B7280" }}
      >
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("visitReason", {
    header: "Reason",
    cell: (info) => (
      <span
        className="truncate max-w-[150px] inline-block text-sm text-muted-foreground"
        title={info.getValue()}
      >
        {info.getValue()}
      </span>
    ),
  }),
];

export function PatientAppointmentsList() {
  // Local state for pagination and filtering
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  // 2. Fetch the data from ASP.NET via Orval!
  const {
    data: pagedResult,
    isLoading,
    isError,
  } = useGetAllAppointments({
    view,
    page,
    pageSize: 5, // Keep it small to easily test pagination
  });

  // 3. Initialize TanStack Table
  const table = useReactTable({
    data: pagedResult?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">My Appointments</CardTitle>
          <CardDescription>View and manage your clinical visits.</CardDescription>
        </div>

        {/* shadcn Tabs for Filtering */}
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as any);
            setPage(1);
          }}
          className="w-[200px]"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {isError ? (
          <div className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
            Failed to load appointments. Please try again.
          </div>
        ) : (
          <div className="space-y-4">
            {/* shadcn Table Component */}
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
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        Loading appointments...
                      </TableCell>
                    </TableRow>
                  ) : table.getRowModel().rows?.length ? (
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
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No {view} appointments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-2">
              <div className="text-sm text-muted-foreground">
                Showing page {pagedResult?.page || 1} of {pagedResult?.totalPages || 1}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!pagedResult?.hasPreviousPage || isLoading}
                >
                  <ChevronLeft className="size-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!pagedResult?.hasNextPage || isLoading}
                >
                  Next <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
