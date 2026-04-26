import { Link } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/store/useAuthStore";
import { ReceptionistPatientsPage } from "./roles/ReceptionistPatientsPage";

export function PatientsListingPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();
  const isAdmin = role === "admin";

  const renderPatientsPage = () => {
    switch (role) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistPatientsPage />;
      case "doctor":
        return "";
      case "admin":
        return null;
      case "lab-tech":
        return "Do something";
      default:
        return <div>Invalid Role Detected</div>;
    }
  };

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patients List</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {!isAdmin && (
          <p className="mt-0.5 text-muted-foreground text-sm">
            View and manage all active patients in one place
          </p>
        )}
      </div>
      {renderPatientsPage()}
    </>
  );
}
