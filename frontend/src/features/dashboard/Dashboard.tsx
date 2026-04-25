import { Link } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-2xl">Good morning, {user?.firstName ?? "User"}</h1>
            <p className="mt-0.5 text-muted-foreground text-sm">
              Here's what's happening at the clinic today.
            </p>
          </div>
          {user?.role?.toLowerCase() === "patient" && (
            <Button
              render={
                <Link to="/appointments/book">
                  <CalendarPlus className="mr-2 size-4" />
                  Book New Appointment
                </Link>
              }
            />
          )}
        </div>
      </div>
      {renderDashboardContent()}
    </>
  );
}
