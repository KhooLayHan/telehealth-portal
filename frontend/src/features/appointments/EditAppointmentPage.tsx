import { Link, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/store/useAuthStore";
import { ReceptionistEditApptPage } from "./roles/ReceptionistEditAppointment";

export function EditAppointmentPage() {
  const { id } = useParams({ from: "/_protected/appointments/edit/$id" });
  const { user } = useAuthStore();

  const renderEditAppointment = () => {
    const role = user?.role?.toLowerCase();

    switch (role) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistEditApptPage />;
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
              <BreadcrumbLink render={<Link to="/appointments" search={{ today: undefined }} />}>
                Appointments
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Edit Appointment</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-2 text-muted-foreground text-sm">Appointment ID: {id}</p>
      </div>

      {renderEditAppointment()}
    </>
  );
}
