import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, UserX } from "lucide-react";
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
import { cn } from "@/lib/utils";

// Represents a lab technician row before backend integration is connected.
export interface LabTechRecord {
  publicId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  staffId: string;
  laboratory: string;
  status: "Active" | "Training" | "On Leave";
  createdAt: string;
  avatarUrl?: string | null;
}

// Keeps lab technician table columns stable across different data lengths.
const COLUMN_STYLES: Record<string, { cell: string; header: string }> = {
  firstName: {
    header: "min-w-56 w-[28%]",
    cell: "min-w-56 w-[28%]",
  },
  email: {
    header: "min-w-64 w-[30%]",
    cell: "min-w-64 w-[30%]",
  },
  phoneNumber: {
    header: "w-40",
    cell: "w-40",
  },
  createdAt: {
    header: "w-36",
    cell: "w-36",
  },
  actions: {
    header: "w-32 text-right",
    cell: "w-32",
  },
};

// Returns the width and alignment classes for a table column.
function getColumnStyle(columnId: string, part: "cell" | "header"): string {
  return COLUMN_STYLES[columnId]?.[part] ?? "";
}

// Formats a date string as "15 Apr 1982".
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Builds a two-letter fallback for lab technician avatars.
function getLabTechInitials(labTech: LabTechRecord): string {
  return `${labTech.firstName[0] ?? ""}${labTech.lastName[0] ?? ""}`.toUpperCase();
}

// Describes optional table actions supplied by the parent page.
interface LabTechTableMeta {
  onView?: (labTech: LabTechRecord) => void;
  onEdit?: (labTech: LabTechRecord) => void;
  onDeactivate?: (labTech: LabTechRecord) => void;
}

// Column definitions for the lab technicians data table.
const columns: ColumnDef<LabTechRecord>[] = [
  {
    accessorKey: "firstName",
    header: "Name",
    cell: ({ row }) => {
      const labTech = row.original;
      const fullName = `${labTech.firstName} ${labTech.lastName}`;

      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground">
            {labTech.avatarUrl ? (
              <img
                src={labTech.avatarUrl}
                alt={`${fullName} avatar`}
                className="size-full object-cover"
              />
            ) : (
              getLabTechInitials(labTech)
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium">{fullName}</span>
            <span className="truncate font-mono text-muted-foreground text-xs">
              @{labTech.username}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="block truncate text-muted-foreground text-xs">{row.getValue("email")}</span>
    ),
  },
  {
    accessorKey: "phoneNumber",
    header: "Phone",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.getValue("phoneNumber") || "-"}</span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{formatDate(row.getValue("createdAt"))}</span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const meta = table.options.meta as LabTechTableMeta;

      return (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="View details"
            disabled={!meta.onView}
            onClick={() => meta.onView?.(row.original)}
          >
            <Eye className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Edit lab technician"
            disabled={!meta.onEdit}
            onClick={() => meta.onEdit?.(row.original)}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            title="Remove lab technician"
            disabled={!meta.onDeactivate}
            onClick={() => meta.onDeactivate?.(row.original)}
          >
            <UserX className="size-3.5" />
          </Button>
        </div>
      );
    },
  },
];

// Describes the data and controls needed by the lab technician table.
interface LabTechTableProps extends LabTechTableMeta {
  data: LabTechRecord[];
  page: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

// Paginated and searchable data table for the lab technicians list.
export function LabTechTable({
  data,
  page,
  totalCount,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  search,
  onSearchChange,
  onView,
  onEdit,
  onDeactivate,
}: LabTechTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView, onEdit, onDeactivate },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">{totalCount}</span>{" "}
          {totalCount === 1 ? "lab technician record" : "lab technician records"} found
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <Table className="min-w-[52rem]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-foreground/20 bg-foreground hover:bg-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "px-5 py-3.5 font-semibold text-[11px] text-background/70 uppercase tracking-[0.15em]",
                      getColumnStyle(header.column.id, "header"),
                    )}
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
                    <TableCell
                      key={cell.id}
                      className={cn("px-5 py-3.5 text-sm", getColumnStyle(cell.column.id, "cell"))}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center">
                  <p className="text-sm text-muted-foreground">No lab technicians found.</p>
                  <p className="mt-1 text-muted-foreground/60 text-xs">
                    Try adjusting your search.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-muted-foreground text-xs">
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
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push(`ellipsis-after-${arr[idx - 1]}`);
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-1 text-muted-foreground text-xs">
                    ...
                  </span>
                ) : (
                  <Button
                    key={item}
                    variant={item === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
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
