import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useGetDoctorSchedule } from "@/api/generated/doctors/doctors";

const PAGE_SIZE = 15;

export type StatusFilter = "all" | "booked" | "cancelled" | "completed";

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function UseDoctorAppointmentPage() {
  const { today } = useSearch({ from: "/_protected/appointments_" });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [todayOnly, setTodayOnly] = useState(today ?? false);

  const statusSlug = statusFilter === "all" ? undefined : statusFilter;

  const { data, isLoading, isError } = useGetDoctorSchedule({
    Date: todayOnly ? getTodayStr() : undefined,
    Status: statusSlug,
    Search: search.trim() || undefined,
    Page: page,
    PageSize: PAGE_SIZE,
  });

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
    setTodayOnly((prev) => !prev);
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
