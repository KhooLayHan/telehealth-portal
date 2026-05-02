import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
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

// Formats a date string as "15 Apr 1982".
function formatDate(value: unknown): string {
  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Converts the stored gender code into a readable table label.
function genderLabel(code: string | null): string {
  if (!code) {
    return "N/A";
  }

  const map: Record<string, string> = {
    F: "Female",
    M: "Male",
    N: "Not Specified",
    O: "Other",
  };

  return map[code] ?? code;
}

// Builds a two-letter fallback for receptionist avatars.
function getReceptionistInitials(receptionist: AdminReceptionistDto): string {
  const firstInitial = receptionist.firstName.trim().at(0) ?? "";
  const lastInitial = receptionist.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "R";
}

// Describes optional table actions supplied by the parent page.
interface ReceptionistTableMeta {
  onView?: (receptionist: AdminReceptionistDto) => void;
  onEdit?: (receptionist: AdminReceptionistDto) => void;
  onDeactivate?: (receptionist: AdminReceptionistDto) => void;
}

// Builds the receptionist table columns with row actions.
function getReceptionistColumns(): ColumnDef<AdminReceptionistDto>[] {
  return [
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => {
        const receptionist = row.original;
        const fullName = `${receptionist.firstName} ${receptionist.lastName}`;

        return (
          <div className="flex min-w-48 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground text-xs">
              {receptionist.avatarUrl ? (
                <img
                  src={receptionist.avatarUrl}
                  alt={fullName}
                  className="size-full object-cover"
                />
              ) : (
                getReceptionistInitials(receptionist)
              )}
            </div>
            <span className="font-medium">{fullName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.getValue<string>("phoneNumber") || "N/A"}</span>
      ),
    },
    {
      accessorKey: "dateOfBirth",
      header: "Date of Birth",
      cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("dateOfBirth"))}</span>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => (
        <span className="text-xs">{genderLabel(row.getValue<string | null>("gender"))}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined At",
      cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("createdAt"))}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row, table }) => {
        const meta = table.options.meta as ReceptionistTableMeta;

        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              disabled={!meta.onView}
              aria-label="View receptionist details"
              title="View receptionist details"
              onClick={() => meta.onView?.(row.original)}
            >
              <Eye className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              disabled={!meta.onEdit}
              aria-label="Edit receptionist"
              title="Edit receptionist"
              onClick={() => meta.onEdit?.(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              disabled={!meta.onDeactivate}
              aria-label="Remove receptionist record"
              title="Remove receptionist record"
              onClick={() => meta.onDeactivate?.(row.original)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}

// Describes the data and controls needed by the receptionist table.
interface ReceptionistTableProps extends ReceptionistTableMeta {
  data: AdminReceptionistDto[];
  page: number;
  totalCount: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

// Paginated and searchable data table for the receptionists list.
export function ReceptionistTable({
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
}: ReceptionistTableProps) {
  const columns = useMemo(() => getReceptionistColumns(), []);
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
          <label htmlFor="receptionist-search" className="sr-only">
            Search receptionists
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="receptionist-search"
            placeholder="Search by name..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">{totalCount}</span>{" "}
          {totalCount === 1 ? "receptionist record" : "receptionist records"} found
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-foreground/20 bg-foreground hover:bg-foreground"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-5 py-3.5 font-semibold text-[11px] text-background/70 uppercase tracking-[0.15em]"
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
                  <p className="text-sm text-muted-foreground">No receptionists found.</p>
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
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-xs">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            <span className="hidden sm:inline"> - {totalCount} total</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={hasPreviousPage === false || page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                const previousPage = arr[idx - 1];

                if (previousPage && p - previousPage > 1) {
                  acc.push(`ellipsis-after-${previousPage}`);
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
              disabled={hasNextPage === false || page === totalPages}
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
