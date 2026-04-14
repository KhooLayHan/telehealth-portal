import { useState } from "react";

import { useGetAllAppointments } from "@/api/generated/patients/patients";
import type { PagedResultOfAppointmentDto } from "@/api/model/PagedResultOfAppointmentDto";

export type AppointmentView = "upcoming" | "past";

const PAGE_SIZE = 5;

export type UseAppointmentsReturn = {
  pagedResult: PagedResultOfAppointmentDto | undefined;
  isLoading: boolean;
  isError: boolean;
  page: number;
  view: AppointmentView;
  handleViewChange: (v: string) => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
};

export function useAppointments(): UseAppointmentsReturn {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AppointmentView>("upcoming");

  const {
    data: response,
    isLoading,
    isError,
  } = useGetAllAppointments({
    View: view,
    Page: page,
    PageSize: PAGE_SIZE,
  });

  const pagedResult = response?.status === 200 ? response.data : undefined;

  const isAppointmentView = (value: string): value is AppointmentView =>
    value === "upcoming" || value === "past";

  const handleViewChange = (v: string) => {
    if (!isAppointmentView(v)) return;
    setView(v);
    setPage(1);
  };

  const handlePreviousPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  return {
    pagedResult,
    isLoading,
    isError,
    page,
    view,
    handleViewChange,
    handlePreviousPage,
    handleNextPage,
  };
}
