import { useEffect, useMemo, useState } from "react";
import { useAdminGetAllDepartments } from "@/api/generated/admins/admins";
import type { AdminDepartmentDto } from "@/api/model/AdminDepartmentDto";

const DEPARTMENTS_PAGE_SIZE = 5;

// Represents one department row shown in the admin department table.
export interface DepartmentTableRow {
  id: string;
  name: string;
  description: string;
  staffMembers: number;
}

// Converts the API department response into the row shape used by the table.
function toDepartmentTableRow(department: AdminDepartmentDto): DepartmentTableRow {
  return {
    id: department.slug,
    name: department.name,
    description: department.description ?? "",
    staffMembers: Number(department.staffMembers ?? 0),
  };
}

// Fetches departments and exposes local pagination state for the table.
export function useDepartmentsTable() {
  const [page, setPage] = useState(1);
  const { data, isError, isLoading } = useAdminGetAllDepartments();

  const allDepartments = useMemo(
    () => (data?.status === 200 ? data.data.map(toDepartmentTableRow) : []),
    [data],
  );

  const totalCount = allDepartments.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / DEPARTMENTS_PAGE_SIZE));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const departments = useMemo(() => {
    const startIndex = (page - 1) * DEPARTMENTS_PAGE_SIZE;
    return allDepartments.slice(startIndex, startIndex + DEPARTMENTS_PAGE_SIZE);
  }, [allDepartments, page]);

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
