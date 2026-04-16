import { useState } from "react";
import { useGetDoctorPatients } from "@/api/generated/doctors/doctors";

const PAGE_SIZE = 15;

export function UseDoctorPatientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useGetDoctorPatients({
    Search: search.trim() || undefined,
    Page: page,
    PageSize: PAGE_SIZE,
  });

  const result = data?.status === 200 ? data.data : null;
  const items = result?.items ?? [];
  const totalCount = Number(result?.totalCount ?? 0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  return {
    items,
    totalCount,
    totalPages,
    page,
    search,
    isLoading,
    isError,
    setPage,
    handleSearchChange,
  };
}
