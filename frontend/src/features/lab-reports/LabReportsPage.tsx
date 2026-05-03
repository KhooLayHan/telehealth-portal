import { useAuthStore } from "@/store/useAuthStore";
import { LabTechLabReportsPage } from "./roles/LabTechLabReportsPage";

export function LabReportsPage() {
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase();

  switch (role) {
    case "lab-tech":
      return <LabTechLabReportsPage />;
    // case "admin":
    // case "doctor":
    // case "patient":
    default:
      return <div>Invalid Role Detected</div>;
  }
}
