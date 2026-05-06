import { FileDown, Plus } from "lucide-react";
import { useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { AddNewDepartmentForm } from "@/features/admins/manageDepartments/AddNewDepartmentForm";
import { DeleteDepartmentDialog } from "@/features/admins/manageDepartments/DeleteDepartmentDialog";
import { DepartmentsTable } from "@/features/admins/manageDepartments/DepartmentsTable";
import { EditDepartmentForm } from "@/features/admins/manageDepartments/EditDepartmentForm";
import { useDepartmentsCsvExport } from "@/features/admins/manageDepartments/UseDepartmentsCsvExport";
import type { DepartmentTableRow } from "@/features/admins/manageDepartments/UseDepartmentsTable";

// Displays the admin department management page with a header and department table.
export function AdminDepartmentPage() {
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);
  const [editDepartmentOpen, setEditDepartmentOpen] = useState(false);
  const [deleteDepartmentOpen, setDeleteDepartmentOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<DepartmentTableRow | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentTableRow | null>(null);
  const { exportDepartmentsCsv, isExportDisabled } = useDepartmentsCsvExport();

  const handleEditDepartment = (department: DepartmentTableRow) => {
    setEditingDepartment(department);
    setEditDepartmentOpen(true);
  };

  const handleDeleteDepartment = (department: DepartmentTableRow) => {
    setDeletingDepartment(department);
    setDeleteDepartmentOpen(true);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Departments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Manage Departments</h1>
            <p className="text-lg text-muted-foreground">
              Organize care departments and track staff coverage across the platform.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              className="h-9 gap-1.5 bg-background"
              disabled={isExportDisabled}
              onClick={() => void exportDepartmentsCsv()}
            >
              <FileDown className="size-4" />
              Export CSV
            </Button>
            <Button
              type="button"
              className="h-9 gap-1.5 bg-black text-white hover:bg-black/85"
              onClick={() => setAddDepartmentOpen(true)}
            >
              <Plus className="size-4" />
              Add New Department
            </Button>
          </div>
        </div>
      </header>

      <DepartmentsTable
        search={departmentSearch}
        onSearchChange={setDepartmentSearch}
        onEditDepartment={handleEditDepartment}
        onDeleteDepartment={handleDeleteDepartment}
      />
      <AddNewDepartmentForm open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen} />
      <EditDepartmentForm
        department={editingDepartment}
        open={editDepartmentOpen}
        onOpenChange={setEditDepartmentOpen}
      />
      <DeleteDepartmentDialog
        department={deletingDepartment}
        open={deleteDepartmentOpen}
        onOpenChange={setDeleteDepartmentOpen}
      />
    </div>
  );
}
