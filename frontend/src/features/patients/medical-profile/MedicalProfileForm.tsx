import { useGetProfile } from "@/api/generated/patients/patients";
import { ProfileFormInner } from "./components/ProfileFormInner";

export function PatientMedicalProfileForm() {
  const { data: response, isLoading, isError } = useGetProfile();

  const profile = response?.status === 200 ? response.data : undefined;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Loading profile...
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
      >
        Failed to load profile data.
      </div>
    );
  }

  return <ProfileFormInner profile={profile} />;
}
