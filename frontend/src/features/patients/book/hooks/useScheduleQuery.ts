import { useGetAllAvailable } from "@/api/generated/schedules/schedules";

interface UseScheduleQueryParams {
  selectedDate: string;
  selectedDoctorId: string;
}

export function useScheduleQuery({ selectedDate, selectedDoctorId }: UseScheduleQueryParams) {
  const {
    data: schedulesResponse,
    isLoading: isLoadingSchedules,
    isError: isSchedulesRequestError,
  } = useGetAllAvailable(
    { Date: selectedDate, DoctorPublicId: selectedDoctorId || undefined },
    { query: { enabled: !!selectedDate } },
  );

  const isSchedulesError =
    isSchedulesRequestError ||
    (schedulesResponse !== undefined && schedulesResponse.status !== 200);

  const availableSchedules = schedulesResponse?.status === 200 ? schedulesResponse.data : [];

  return {
    availableSchedules,
    isLoading: isLoadingSchedules,
    isError: isSchedulesError,
  };
}
