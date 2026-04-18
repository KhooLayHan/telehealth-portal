import { createFileRoute, redirect } from "@tanstack/react-router";

import { PatientMedicalProfileForm } from "@/features/patients/medical-profile/MedicalProfileForm";
import { useAuthStore } from "@/store/useAuthStore";

function MedicalProfileRoute() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 font-bold text-2xl">Medical Profile</h1>
      <PatientMedicalProfileForm />
    </div>
  );
}

export const Route = createFileRoute("/_protected/patients/$id/medical-profile")({
  beforeLoad: ({ params }) => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();
    const userPublicId = user?.publicId;

    // Patients can only access their own medical profile
    if (role === "patient" && userPublicId && params.id !== userPublicId) {
      throw redirect({
        to: "/patients/$id/medical-profile",
        params: { id: userPublicId },
      });
    }
  },
  component: MedicalProfileRoute,
});
