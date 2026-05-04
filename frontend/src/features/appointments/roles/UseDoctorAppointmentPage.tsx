import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useGetDoctorSchedule } from "@/api/generated/doctors/doctors";

const PAGE_SIZE = 15;

export type StatusFilter =
  | "all"
  | "booked"
  | "checked-in"
  | "in-progress"
  | "cancelled"
  | "completed";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function UseDoctorAppointmentPage() {
  const navigate = useNavigate();
  const { today } = useSearch({ from: "/_protected/appointments_" });
  const todayOnly = today === true;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const statusSlug = statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading, isError } = useGetDoctorSchedule(
    {
      Date: todayOnly ? getTodayStr() : undefined,
      Status: statusSlug,
      Search: search.trim() || undefined,
      Page: page,
      PageSize: PAGE_SIZE,
    },
    { query: { refetchInterval: 1_500 } },
  );

  const schedule = data?.status === 200 ? data.data : null;
  const totalCount = Number(schedule?.totalCount ?? 0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: StatusFilter) {
    setStatusFilter(value);
    setPage(1);
  }

  function handleTodayToggle() {
    navigate({
      to: "/appointments",
      search: { today: todayOnly ? undefined : true },
    });
    setPage(1);
  }

  return {
    items: schedule?.items ?? [],
    totalCount,
    totalPages,
    page,
    pageSize: PAGE_SIZE,
    search,
    statusFilter,
    todayOnly,
    isLoading,
    isError,
    setPage,
    handleSearchChange,
    handleStatusChange,
    handleTodayToggle,
  };
}
