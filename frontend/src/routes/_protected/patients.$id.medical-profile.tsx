import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PatientMedicalProfileForm } from "@/features/patients/medical-profile/MedicalProfileForm";
import { useAuthStore } from "@/store/useAuthStore";

function MedicalProfileRouteComponent() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Medical Profile</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <PatientMedicalProfileForm />
    </div>
  );
}

export const Route = createFileRoute("/_protected/patients/$id/medical-profile")({
  beforeLoad: ({ params }) => {
    const user = useAuthStore.getState().user;
    const role = user?.role?.toLowerCase();
    const userPublicId = user?.publicId;

    if (role !== "patient") {
      throw redirect({ to: "/dashboard" });
    }
    if (!userPublicId) {
      throw redirect({ to: "/login" });
    }
    if (params.id !== userPublicId) {
      throw redirect({
        to: "/patients/$id/medical-profile",
        params: { id: userPublicId },
      });
    }
  },
  component: MedicalProfileRouteComponent,
});
