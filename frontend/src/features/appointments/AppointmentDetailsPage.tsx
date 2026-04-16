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
import { DoctorApptDetailsPage } from "./roles/DoctorAppointmentDetailsPage";
import { ReceptionistApptDetailsPage } from "./roles/ReceptionistAppointmentDetails";

export function AppointmentDetailsPage() {
  const { id } = useParams({ from: "/_protected/appointments/$id" });
  const { user } = useAuthStore();

  const renderApptDetails = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistApptDetailsPage />;
      case "doctor":
        return <DoctorApptDetailsPage />;
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
              <BreadcrumbPage>Appointment Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-2 text-muted-foreground text-sm">Appointment ID: {id}</p>
      </div>
      {renderApptDetails()}
    </>
  );
}
