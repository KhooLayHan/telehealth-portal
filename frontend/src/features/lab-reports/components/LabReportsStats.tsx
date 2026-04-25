import { ClipboardList, FileCheck, FileText } from "lucide-react";

interface LabReportsStatsProps {
  pendingCount: number;
  completedCount: number;
  totalCount: number;
}

export function LabReportsStats({
  pendingCount,
  completedCount,
  totalCount,
}: LabReportsStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
          <ClipboardList className="size-5 text-amber-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending Reports</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
          <FileCheck className="size-5 text-green-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed Today</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
          <FileText className="size-5 text-blue-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Total Reports</p>
        </div>
      </div>
    </div>
  );
}
