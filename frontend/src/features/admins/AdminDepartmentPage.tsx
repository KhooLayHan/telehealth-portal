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
import { DepartmentsTable } from "@/features/admins/manageDepartments/DepartmentsTable";

// Displays the admin department management page with a header and department table.
export function AdminDepartmentPage() {
  const [addDepartmentOpen, setAddDepartmentOpen] = useState(false);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-muted-foreground">Staff Management</BreadcrumbPage>
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
              Manage registered departments and staff coverage across the platform.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button type="button" variant="outline" className="h-9 gap-1.5 bg-background">
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

      <DepartmentsTable />
      <AddNewDepartmentForm open={addDepartmentOpen} onOpenChange={setAddDepartmentOpen} />
    </div>
  );
}
