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
import { ReceptionistApptPage } from "./roles/ReceptionistAppointment";

export function AppointmentsPage() {
  const { user } = useAuthStore();

  const renderAppointmentContent = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistApptPage />;
      case "doctor":
        return "Do something";
      case "admin":
        return "Do something";
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
              <BreadcrumbPage>Appointments</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-0.5 text-muted-foreground text-sm">
          View and manage all scheduled appointments in one place
        </p>
      </div>
      {renderAppointmentContent()}
    </>
  );
}
