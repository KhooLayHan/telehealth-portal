import { Pencil, Trash2 } from "lucide-react";
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

// Props for the department table while the feature is still frontend-only.
interface DepartmentsTableProps {
  departments?: DepartmentTableRow[];
  onEditDepartment?: (department: DepartmentTableRow) => void;
  onDeleteDepartment?: (department: DepartmentTableRow) => void;
}

// Local placeholder departments used until the backend endpoint is connected.
const sampleDepartments: DepartmentTableRow[] = [
  {
    id: "cardiology",
    name: "Cardiology",
    description: "Heart care, diagnostics, and long-term cardiac treatment plans.",
    staffMembers: 18,
  },
  {
    id: "dermatology",
    name: "Dermatology",
    description: "Skin, hair, and nail consultation services for patients.",
    staffMembers: 9,
  },
  {
    id: "pediatrics",
    name: "Pediatrics",
    description: "Primary care and specialist support for children and adolescents.",
    staffMembers: 14,
  },
  {
    id: "radiology",
    name: "Radiology",
    description: "Medical imaging review, reporting, and diagnostic support.",
    staffMembers: 7,
  },
];

// Displays the admin-facing departments table with local placeholder data.
export function DepartmentsTable({
  departments = sampleDepartments,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentsTableProps) {
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
                <p className="text-sm text-muted-foreground">No departments found.</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Add a department to start tracking staff coverage.
                </p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
