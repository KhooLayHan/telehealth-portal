import { useGetAll } from "@/api/generated/doctors/doctors";

export function useDoctorsQuery() {
  const { data: response, isLoading } = useGetAll();
  const doctors = response?.status === 200 && Array.isArray(response.data) ? response.data : [];
  return { doctors, isLoading };
}
