import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DepartmentsTable } from "@/features/admins/manageDepartments/DepartmentsTable";

// Displays the admin department management page with a header and department table.
export function AdminDepartmentPage() {
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

        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Manage Departments</h1>
          <p className="text-lg text-muted-foreground">
            Manage registered departments and staff coverage across the platform.
          </p>
        </div>
      </header>

      <DepartmentsTable />
    </div>
  );
}
