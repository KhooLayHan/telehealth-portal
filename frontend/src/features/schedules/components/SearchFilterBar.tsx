import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCENT } from "../ScheduleUtils";

type StatusFilter = "all" | "available" | "booked";

interface SearchFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  hasFilters: boolean;
  onClear: () => void;
  filteredCount: number;
  totalCount: number;
}

export function SearchFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  hasFilters,
  onClear,
  filteredCount,
  totalCount,
}: SearchFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search input */}
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          className="h-8 pl-8 text-xs"
          placeholder="Search doctor, patient, visit reason…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => onSearchChange("")}
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Status segmented control */}
      <div className="flex items-center rounded-lg border border-border overflow-hidden h-8">
        {(["all", "available", "booked"] as const).map((f) => (
          <button
            type="button"
            key={f}
            onClick={() => onStatusChange(f)}
            className={`px-3 text-xs font-medium h-full transition-colors capitalize cursor-pointer ${
              statusFilter === f
                ? "text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
            style={statusFilter === f ? { background: ACCENT } : {}}
          >
            {f}
          </button>
        ))}
      </div>

      {hasFilters && (
        <Button
          size="sm"
          variant="ghost"
          className="h-8 text-xs text-muted-foreground gap-1.5"
          onClick={onClear}
        >
          <X className="size-3" />
          Clear filters
        </Button>
      )}

      {hasFilters && (
        <span className="text-xs text-muted-foreground">
          Showing {filteredCount} of {totalCount}
        </span>
      )}
    </div>
  );
}
