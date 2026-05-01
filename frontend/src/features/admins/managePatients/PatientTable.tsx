import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";

import type { ClinicStaffPatientDto } from "@/api/model/ClinicStaffPatientDto";
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

// Describes the action callbacks available to each patient table row.
interface PatientTableActions {
  onView?: (patient: ClinicStaffPatientDto) => void;
  onEdit?: (patient: ClinicStaffPatientDto) => void;
  onRemove?: (patient: ClinicStaffPatientDto) => void;
}

// Describes the data, pagination, and toolbar handlers used by the patient table.
interface PatientTableProps extends PatientTableActions {
  data: ClinicStaffPatientDto[];
  isLoading: boolean;
  page: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onAddNew?: () => void;
  toolbarActions?: ReactNode;
}

// Extends generated patient rows with the avatar URL returned by the API.
type PatientWithAvatar = ClinicStaffPatientDto & {
  avatarUrl?: string | null;
};

// Formats an API date value for display inside the patient table.
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

// Builds stable initials for the patient avatar fallback.
function getInitials(patient: ClinicStaffPatientDto): string {
  const firstInitial = patient.firstName.trim().at(0) ?? "";
  const lastInitial = patient.lastName.trim().at(0) ?? "";
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();

  return initials || "P";
}

// Reads the optional avatar URL returned by newer patient list responses.
function getAvatarUrl(patient: ClinicStaffPatientDto): string | null {
  return (patient as PatientWithAvatar).avatarUrl ?? null;
}

// Builds the patient table columns with row actions.
function getPatientColumns(): ColumnDef<ClinicStaffPatientDto>[] {
  return [
    {
      accessorKey: "firstName",
      header: "Name",
      cell: ({ row }) => {
        const patient = row.original;
        const fullName = `${patient.firstName} ${patient.lastName}`;
        const avatarUrl = getAvatarUrl(patient);

        return (
          <div className="flex min-w-48 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground text-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName} className="size-full object-cover" />
              ) : (
                getInitials(patient)
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
      accessorKey: "joinedAt",
      header: "Joined At",
      cell: ({ row }) => <span className="text-xs">{formatDate(row.getValue("joinedAt"))}</span>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row, table }) => {
        const meta = table.options.meta as PatientTableActions;

        return (
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              disabled={!meta.onView}
              aria-label="View patient details"
              title="View patient details"
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
              aria-label="Edit patient"
              title="Edit patient"
              onClick={() => meta.onEdit?.(row.original)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              disabled={!meta.onRemove}
              aria-label="Remove patient record"
              title="Remove patient record"
              onClick={() => meta.onRemove?.(row.original)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}

// Renders the paginated, searchable patient records table.
export function PatientTable({
  data,
  isLoading,
  page,
  totalCount,
  totalPages,
  onPageChange,
  search,
  onSearchChange,
  onView,
  onEdit,
  onRemove,
  onAddNew,
  toolbarActions,
}: PatientTableProps) {
  const columns = useMemo(() => getPatientColumns(), []);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onView, onEdit, onRemove },
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <label htmlFor="patient-search" className="sr-only">
              Search patients
            </label>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="patient-search"
              placeholder="Search by name..."
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            {toolbarActions}
            {isLoading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          {onAddNew && (
            <Button
              type="button"
              size="sm"
              className="h-9 gap-1.5 bg-foreground text-background hover:bg-foreground/90"
              onClick={onAddNew}
            >
              <Plus className="size-3.5" />
              Add New Patient
            </Button>
          )}
          <p className="text-sm text-muted-foreground" aria-live="polite">
            <span className="font-semibold text-foreground">{totalCount}</span>{" "}
            {totalCount === 1 ? "patient" : "patients"} found
          </p>
        </div>
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
                    className="px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70"
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
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                  style={{ animationDelay: `${index * 30}ms` }}
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
                  <p className="text-sm text-muted-foreground">
                    {isLoading ? "Loading patients..." : "No patients found."}
                  </p>
                  {!isLoading && (
                    <p className="mt-1 text-xs text-muted-foreground/60">
                      Try adjusting your search.
                    </p>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            <span className="hidden sm:inline"> - {totalCount} total</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (pageNumber) =>
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1),
              )
              .reduce<(number | string)[]>((accumulator, pageNumber, index, visiblePages) => {
                const previousPage = visiblePages[index - 1];

                if (previousPage && pageNumber - previousPage > 1) {
                  accumulator.push(`ellipsis-after-${previousPage}`);
                }

                accumulator.push(pageNumber);
                return accumulator;
              }, [])
              .map((item) =>
                typeof item === "string" ? (
                  <span key={item} className="px-1 text-xs text-muted-foreground">
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
              disabled={page === totalPages}
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
