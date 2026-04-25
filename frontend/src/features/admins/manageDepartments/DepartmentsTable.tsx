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
    <div className="rounded-lg border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-48">Department Name</TableHead>
            <TableHead className="min-w-80">Description</TableHead>
            <TableHead className="w-36 text-right">Staff Members</TableHead>
            <TableHead className="w-28 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.length > 0 ? (
            departments.map((department) => (
              <TableRow key={department.id}>
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell className="max-w-xl whitespace-normal text-muted-foreground">
                  {department.description}
                </TableCell>
                <TableCell className="text-right tabular-nums">{department.staffMembers}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${department.name}`}
                      onClick={() => onEditDepartment?.(department)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${department.name}`}
                      onClick={() => onDeleteDepartment?.(department)}
                    >
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                No departments added yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
