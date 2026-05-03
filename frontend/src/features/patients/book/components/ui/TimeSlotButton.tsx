import { Clock } from "lucide-react";
import type { AvailableScheduleDto } from "@/api/model/AvailableScheduleDto";
import { formatLocalTime } from "../../schema";

type TimeSlotButtonProps = {
  slot: Required<Pick<AvailableScheduleDto, "publicId" | "startTime" | "endTime">>;
  isSelected: boolean;
  isDisabled?: boolean;
  onClick: () => void;
};

export function TimeSlotButton({
  slot,
  isSelected,
  isDisabled = false,
  onClick,
}: TimeSlotButtonProps) {
  return (
    <button
      key={slot.publicId}
      type="button"
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-md border p-3 transition-all ${
        isDisabled
          ? "cursor-not-allowed border-border bg-muted/20 opacity-50"
          : isSelected
            ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <Clock className="mb-1 size-4" />
      <span className="text-sm font-medium">
        {formatLocalTime(slot.startTime)} - {formatLocalTime(slot.endTime)}
      </span>
    </button>
  );
}
