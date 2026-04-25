import { useState } from "react";

import { useGetAllAppointments } from "@/api/generated/patients/patients";
import type { AppointmentDto } from "@/api/model/AppointmentDto";
import type { PagedResultOfAppointmentDto } from "@/api/model/PagedResultOfAppointmentDto";

export type AppointmentView = "upcoming" | "past";

const PAGE_SIZE = 5;

export type UseAppointmentsReturn = {
  pagedResult: PagedResultOfAppointmentDto | undefined;
  filteredItems: AppointmentDto[];
  isLoading: boolean;
  isError: boolean;
  page: number;
  view: AppointmentView;
  searchTerm: string;
  handleViewChange: (v: string) => void;
  handleSearchChange: (v: string) => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
};

export function useAppointments(): UseAppointmentsReturn {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<AppointmentView>("upcoming");
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredItems = (pagedResult?.items ?? []).filter((appt) =>
    searchTerm ? appt.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) : true,
  );

  const isAppointmentView = (value: string): value is AppointmentView =>
    value === "upcoming" || value === "past";

  const handleViewChange = (v: string) => {
    if (!isAppointmentView(v)) return;
    setView(v);
    setPage(1);
    setSearchTerm("");
  };

  const handleSearchChange = (v: string) => {
    setSearchTerm(v);
  };

  const handlePreviousPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => p + 1);

  return {
    pagedResult,
    filteredItems,
    isLoading,
    isError,
    page,
    view,
    searchTerm,
    handleViewChange,
    handleSearchChange,
    handlePreviousPage,
    handleNextPage,
  };
}
