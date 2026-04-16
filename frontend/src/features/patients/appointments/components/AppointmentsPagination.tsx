import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type AppointmentsPaginationProps = {
  currentPage: number | string;
  totalPages: number | string | undefined;
  hasPreviousPage: boolean | undefined;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function AppointmentsPagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  isLoading,
  onPreviousPage,
  onNextPage,
}: AppointmentsPaginationProps) {
  return (
    <nav aria-label="Appointments pagination" className="flex items-center justify-between px-2">
      <div className="text-sm text-muted-foreground">
        Showing Page {currentPage} of {totalPages ?? 1}
      </div>
      <div className="flex items-center gap-2 cursor-pointer">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage || isLoading}
        >
          <ChevronLeft className="size-4 mr-1" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || isLoading}
        >
          Next <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </nav>
  );
}
