import { ChevronLeft, ChevronRight, ClipboardList, Eye, Search } from "lucide-react";
import type { LabReportDto } from "@/api/model/LabReportDto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LabReportsTableProps {
  reports: LabReportDto[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onViewReport: (report: LabReportDto) => void;
  emptyMessage: string;
}

function getStatusColor(slug: string): string {
  switch (slug.toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export function LabReportsTable({
  reports,
  isLoading,
  search,
  onSearchChange,
  page,
  totalPages,
  onPageChange,
  onViewReport,
  emptyMessage,
}: LabReportsTableProps) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <label htmlFor="report-search" className="sr-only">
          Search reports
        </label>
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
        />
        <Input
          id="report-search"
          placeholder="Search by patient name or report type..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading reports...</p>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 border rounded-lg border-dashed">
          <ClipboardList className="mx-auto size-8 text-muted-foreground mb-3" aria-hidden="true" />
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left font-medium p-3">Patient</th>
                  <th className="text-left font-medium p-3">Report Type</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Date</th>
                  <th className="text-right font-medium p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report) => (
                  <tr key={report.publicId} className="hover:bg-muted/50">
                    <td className="p-3 font-medium">{report.patientFullName}</td>
                    <td className="p-3 text-muted-foreground">{report.reportType}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={getStatusColor(report.status.slug)}>
                        {report.status.name}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {report.createdAt
                        ? new Date(report.createdAt as unknown as string).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => onViewReport(report)}>
                        <Eye className="size-4 mr-1" aria-hidden="true" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                disabled={!canGoPrevious}
                onClick={() => onPageChange(Math.max(1, page - 1))}
              >
                <ChevronLeft className="size-4 mr-1" aria-hidden="true" />
                Previous
              </Button>
              <span className="text-muted-foreground text-sm" aria-live="polite">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={!canGoNext}
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              >
                Next
                <ChevronRight className="size-4 ml-1" aria-hidden="true" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
