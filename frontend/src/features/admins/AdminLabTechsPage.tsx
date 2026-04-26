import { Link } from "@tanstack/react-router";
import { FileDown, Plus } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";

// Displays the admin lab technician directory page header and action controls.
export function AdminLabTechsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Lab Technician Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-semibold text-3xl tracking-tight">Lab Technician Directory</h1>
            <p className="text-lg text-muted-foreground">
              Manage lab technician accounts and laboratory access across the platform.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
            <Button type="button" variant="outline" className="h-9 gap-1.5 bg-background">
              <FileDown className="size-4" />
              Export CSV
            </Button>
            <Button type="button" className="h-9 gap-1.5 bg-black text-white hover:bg-black/85">
              <Plus className="size-4" />
              Add New Lab Tech
            </Button>
          </div>
        </div>
      </header>
    </div>
  );
}
