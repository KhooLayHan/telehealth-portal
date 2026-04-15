import { useState } from "react";
import { useGetDoctorSchedule } from "@/api/generated/doctors/doctors";

const PAGE_SIZE = 10;

// LocalTime from backend is "HH:mm:ss" — convert to "10:30 AM"
export function formatLocalTime(time?: string): string {
  if (!time) return "—";
  const [h, m] = time.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function UseDoctorSchedule() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGetDoctorSchedule({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search.trim() || undefined,
  });

  const schedule = data?.status === 200 ? data.data : null;

  return {
    schedule,
    isLoading,
    isError,
    page,
    setPage,
    search,
    setSearch,
    pageSize: PAGE_SIZE,
  };
}
