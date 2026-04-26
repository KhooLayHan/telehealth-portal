import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";
import type { Instant } from "@/api/model/Instant";

const DEPARTMENTS_PAGE_SIZE = 5;

// Extends the generated department DTO until the API client is regenerated.
type AdminDepartmentWithCreatedAt = AdminDepartmentDto & {
  createdAt?: Instant;
};

// Represents one department row shown in the admin department table.
export interface DepartmentTableRow {
  id: string;
  name: string;
  description: string;
  staffMembers: number;
  createdAt?: Instant;
}

// Converts the API department response into the row shape used by the table.
function toDepartmentTableRow(department: AdminDepartmentWithCreatedAt): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "",
    staffMembers: Number(department.staffMembers ?? 0),
    createdAt: department.createdAt,
  };
}

// Checks whether a department row matches the visible search text.
function matchesDepartmentSearch(department: DepartmentTableRow, search: string): boolean {
  const searchableText = [
    department.name,
    department.description,
    department.staffMembers.toString(),
  ].join(" ");

  return searchableText.toLowerCase().includes(search);
}

// Fetches departments and exposes local pagination state for the table.
export function useDepartmentsTable(search: string) {
  const [page, setPage] = useState(1);
  const previousSearch = useRef("");
  const { data, isError, isLoading } = useAdminGetAllDepartments();
  const normalizedSearch = search.trim().toLowerCase();

  const allDepartments = useMemo(
    () => (data?.status === 200 ? data.data.map(toDepartmentTableRow) : []),
    [data],
  );

  const filteredDepartments = useMemo(() => {
    if (!normalizedSearch) {
      return allDepartments;
    }

    return allDepartments.filter((department) =>
      matchesDepartmentSearch(department, normalizedSearch),
    );
  }, [allDepartments, normalizedSearch]);

  const totalCount = filteredDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEPARTMENTS_PAGE_SIZE));

  useEffect(() => {
    if (previousSearch.current !== normalizedSearch) {
      previousSearch.current = normalizedSearch;
      setPage(1);
    }
  }, [normalizedSearch]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const departments = useMemo(() => {
    const startIndex = (page - 1) * DEPARTMENTS_PAGE_SIZE;
    return filteredDepartments.slice(startIndex, startIndex + DEPARTMENTS_PAGE_SIZE);
  }, [filteredDepartments, page]);

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
