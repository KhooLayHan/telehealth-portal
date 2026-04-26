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
import { AdminAppointmentPage } from "../admins/AdminAppointmentPage";
import { PatientAppointmentsList } from "../patients/appointments/AppointmentsList";
import { DoctorAppointmentPage } from "./roles/DoctorAppointmentPage";
import { ReceptionistApptPage } from "./roles/ReceptionistAppointment";

export function AppointmentsPage() {
  const { user } = useAuthStore();

  const renderAppointmentContent = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return <PatientAppointmentsList />;
      case "receptionist":
        return <ReceptionistApptPage />;
      case "doctor":
        return <DoctorAppointmentPage />;
      case "admin":
        return <AdminAppointmentPage />;
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
