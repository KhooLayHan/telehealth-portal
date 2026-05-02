import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";
import type { Instant } from "@/api/model/Instant";

const DEPARTMENTS_PAGE_SIZE = 5;

// Represents one department row shown in the admin department table.
export interface DepartmentTableRow {
  id: string;
  name: string;
  description: string;
  staffMembers: number;
  createdAt?: Instant;
}

// Converts the API department response into the row shape used by the table.
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "",
    staffMembers: Number(department.staffMembers ?? 0),
    createdAt: department.createdAt,
  };
}

// Fetches departments with backend pagination and exposes table state handlers.
export function useDepartmentsTable(search: string) {
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const previousSearch = useRef("");
  const normalizedSearch = debouncedSearch.trim();
  const { data, isError, isLoading } = useAdminGetAllDepartments({
    Page: page,
    PageSize: DEPARTMENTS_PAGE_SIZE,
    Search: normalizedSearch || undefined,
  });

  const pagedResult = data?.status === 200 ? data.data : null;
  const departments = useMemo(
    () => (pagedResult?.items ?? []).map(toDepartmentTableRow),
    [pagedResult],
  );
  const totalCount = Number(pagedResult?.totalCount ?? 0);
  const totalPages = Math.max(1, Number(pagedResult?.totalPages ?? 1));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (previousSearch.current !== normalizedSearch) {
      previousSearch.current = normalizedSearch;
      setPage(1);
    }
  }, [normalizedSearch]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  function handlePageChange(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
  }

  return {
    departments,
    isError,
    isLoading,
    page,
    pageSize: DEPARTMENTS_PAGE_SIZE,
    totalCount,
    totalPages,
    onPageChange: handlePageChange,
  };
}
