import { useAuthStore } from "@/store/useAuthStore";
import { AdminDashboard } from "./roles/AdminDashboard";
import { DoctorDashboard } from "./roles/DoctorDashboard";
import { LabTechDashboard } from "./roles/LabTechnicianDashboard";
import { PatientDashboard } from "./roles/PatientDashboard";
import { ReceptionistDashboard } from "./roles/ReceptionistDashboard";

export function Dashboard() {
  const { user } = useAuthStore();

  const renderDashboardContent = () => {
    switch (user?.role?.toLowerCase()) {
      case "patient":
        return <PatientDashboard />;
      case "receptionist":
        return <ReceptionistDashboard />;
      case "doctor":
        return <DoctorDashboard />;
      case "admin":
        return <AdminDashboard />;
      case "lab-tech":
        return <LabTechDashboard />;
      default:
        return <div>Invalid Role Detected</div>;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="font-semibold text-2xl">Good morning, {user?.firstName ?? "User"}</h1>
        <p className="mt-0.5 text-muted-foreground text-sm">
          Here's what's happening at the clinic today.
        </p>
      </div>
      {renderDashboardContent()}
    </>
  );
}
