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
import { ReceptionistCheckPatientHistory } from "./roles/ReceptionistCheckPatientHistory";

export function PatientHistoryPage() {
  const { id } = useParams({ from: "/_protected/patients/$id/history" });
  const { user } = useAuthStore();

  const renderPatientHistory = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return "Do something";
      case "receptionist":
        return <ReceptionistCheckPatientHistory />;
      case "doctor":
        return "";
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
              <BreadcrumbLink render={<Link to={`/patients/$id`} params={{ id }} />}>
                Patient Details
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Patient Visit Record</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* <p className="mt-2 text-muted-foreground text-sm">View Patient Visit History</p> */}
      </div>

      {renderPatientHistory()}
    </>
  );
}
