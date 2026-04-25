import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Represents one department row shown in the admin department table.
export interface DepartmentTableRow {
  id: string;
  name: string;
  description: string;
  staffMembers: number;
}

// Props for department table row actions.
interface DepartmentsTableProps {
  onEditDepartment?: (department: DepartmentTableRow) => void;
  onDeleteDepartment?: (department: DepartmentTableRow) => void;
}

// Converts the API department response into the row shape used by the table.
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "No description provided.",
    staffMembers: Number(department.staffMembers ?? 0),
  };
}

// Displays the admin-facing departments table with backend data.
export function DepartmentsTable({ onEditDepartment, onDeleteDepartment }: DepartmentsTableProps) {
  const { data, isError, isLoading } = useAdminGetAllDepartments();
  const departments = useMemo(
    () => (data?.status === 200 ? data.data.map(toDepartmentTableRow) : []),
    [data],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-foreground/20 bg-foreground hover:bg-foreground">
            <TableHead className="min-w-48 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
              Department Name
            </TableHead>
            <TableHead className="min-w-80 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
              Description
            </TableHead>
            <TableHead className="w-36 px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
              Staff Members
            </TableHead>
            <TableHead className="w-28 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.length > 0 ? (
            departments.map((department) => (
              <TableRow
                key={department.id}
                className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
              >
                <TableCell className="px-5 py-3.5 text-sm font-medium">{department.name}</TableCell>
                <TableCell className="max-w-xl whitespace-normal px-5 py-3.5 text-sm text-muted-foreground">
                  {department.description}
                </TableCell>
                <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums">
                  {department.staffMembers}
                </TableCell>
                <TableCell className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Edit ${department.name}`}
                      title="Edit department"
                      onClick={() => onEditDepartment?.(department)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${department.name}`}
                      title="Delete department"
                      onClick={() => onDeleteDepartment?.(department)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center">
                {isError ? (
                  <p className="text-sm text-destructive">Failed to load departments.</p>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? "Loading departments..." : "No departments found."}
                    </p>
                    {!isLoading && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        Add a department to start tracking staff coverage.
                      </p>
                    )}
                  </>
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
