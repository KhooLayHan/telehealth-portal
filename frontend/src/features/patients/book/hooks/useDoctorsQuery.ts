import { useGetAll } from "@/api/generated/doctors/doctors";

export function useDoctorsQuery() {
  const { data: response, isLoading } = useGetAll({ Page: 1, PageSize: 50 });
  const doctors = response?.status === 200 ? response.data.items : [];
  return { doctors, isLoading };
}
