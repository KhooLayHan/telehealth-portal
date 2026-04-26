import { ChevronLeft, ChevronRight, Pencil, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type DepartmentTableRow, useDepartmentsTable } from "./UseDepartmentsTable";

// Formats a NodaTime Instant string as a readable date for the table.
function formatCreatedAt(createdAt: string | undefined): string {
  if (!createdAt) {
    return "Not available";
  }

  return new Date(createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Props for department table row actions.
interface DepartmentsTableProps {
  search: string;
  onSearchChange: (value: string) => void;
  onEditDepartment?: (department: DepartmentTableRow) => void;
  onDeleteDepartment?: (department: DepartmentTableRow) => void;
}

// Displays the admin-facing departments table with backend data.
export function DepartmentsTable({
  search,
  onSearchChange,
  onEditDepartment,
  onDeleteDepartment,
}: DepartmentsTableProps) {
  const { departments, isError, isLoading, page, totalCount, totalPages, onPageChange } =
    useDepartmentsTable(search);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <label htmlFor="department-search" className="sr-only">
            Search departments
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="department-search"
            value={search}
            placeholder="Search by name or description..."
            className="h-9 pl-9 text-sm"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          <span className="font-semibold text-foreground">{totalCount}</span>{" "}
          {totalCount === 1 ? "department" : "departments"} found
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-foreground/20 bg-foreground hover:bg-foreground">
              <TableHead className="min-w-48 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Department Name
              </TableHead>
              <TableHead className="min-w-80 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Description
              </TableHead>
              <TableHead className="w-36 px-5 py-3.5 text-right text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Staff Members
              </TableHead>
              <TableHead className="w-36 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Created At
              </TableHead>
              <TableHead className="w-28 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-background/70">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length > 0 ? (
              departments.map((department) => (
                <TableRow
                  key={department.id}
                  className="border-b border-border transition-colors duration-100 hover:bg-muted/50"
                >
                  <TableCell className="px-5 py-3.5 text-sm font-medium">
                    {department.name}
                  </TableCell>
                  <TableCell className="max-w-xl whitespace-normal px-5 py-3.5 text-sm text-muted-foreground">
                    {department.description || "No description provided."}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right text-sm tabular-nums">
                    {department.staffMembers}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-sm text-muted-foreground">
                    {formatCreatedAt(department.createdAt)}
                  </TableCell>
                  <TableCell className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Edit ${department.name}`}
                        title="Edit department"
                        onClick={() => onEditDepartment?.(department)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${department.name}`}
                        title="Delete department"
                        onClick={() => onDeleteDepartment?.(department)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  {isError ? (
                    <p className="text-sm text-destructive">Failed to load departments.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {isLoading ? "Loading departments..." : "No departments found."}
                      </p>
                      {!isLoading && (
                        <p className="mt-1 text-xs text-muted-foreground/60">
                          {search.trim()
                            ? "Try adjusting your search."
                            : "Add a department to start tracking staff coverage."}
                        </p>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
            <span className="hidden sm:inline"> · {totalCount} total</span>
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === 1}
              aria-label="Previous departments page"
              title="Previous page"
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="size-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((pageNumber) => {
                return (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= page - 1 && pageNumber <= page + 1)
                );
              })
              .reduce<(number | string)[]>((paginationItems, pageNumber, index, pageNumbers) => {
                if (index > 0 && pageNumber - pageNumbers[index - 1] > 1) {
                  paginationItems.push(`ellipsis-after-${pageNumbers[index - 1]}`);
                }

                paginationItems.push(pageNumber);
                return paginationItems;
              }, [])
              .map((paginationItem) =>
                typeof paginationItem === "string" ? (
                  <span key={paginationItem} className="px-1 text-xs text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={paginationItem}
                    type="button"
                    variant={paginationItem === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    aria-label={`Go to departments page ${paginationItem}`}
                    aria-current={paginationItem === page ? "page" : undefined}
                    onClick={() => onPageChange(paginationItem)}
                  >
                    {paginationItem}
                  </Button>
                ),
              )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={page === totalPages}
              aria-label="Next departments page"
              title="Next page"
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
