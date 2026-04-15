import type { AvailableScheduleDto } from "@/api/model/AvailableScheduleDto";
import { TimeSlotButton } from "./TimeSlotButton";

interface TimeSlotGridProps {
  slots: Required<Pick<AvailableScheduleDto, "publicId" | "startTime" | "endTime">>[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TimeSlotGrid({ slots, selectedId, onSelect }: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => (
        <TimeSlotButton
          key={slot.publicId}
          slot={slot}
          isSelected={selectedId === slot.publicId}
          onClick={() => onSelect(slot.publicId)}
        />
      ))}
    </div>
  );
}
