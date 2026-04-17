import { Link, Outlet, useChildMatches, useParams } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthStore } from "@/store/useAuthStore";
import { DoctorPatientHistoryPage } from "../doctor-patients/DoctorPatientHistoryPage";
import { ReceptionistPatientDetailsPage } from "./roles/ReceptionistPatientDetailsPage";

export function PatientDetailsPage() {
  const { id } = useParams({ from: "/_protected/patients/$id" });
  const { user } = useAuthStore();
  const childMatches = useChildMatches();

  // When a child route (e.g. /patients/$id/history) is active, render it directly
  if (childMatches.length > 0) {
    return <Outlet />;
  }

  const renderPatientDetails = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistPatientDetailsPage />;
      case "doctor":
        return <DoctorPatientHistoryPage />;
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
              <BreadcrumbLink render={<Link to="/patients" />}>Patient List</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patient Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="mt-2 text-muted-foreground text-sm">Patient ID: {id}</p>
      </div>

      {renderPatientDetails()}
    </>
  );
}
