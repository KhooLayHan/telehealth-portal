import type { AvailableScheduleDto } from "@/api/model/AvailableScheduleDto";
import { TimeSlotButton } from "./TimeSlotButton";

type TimeSlotGridProps = {
  slots: Required<Pick<AvailableScheduleDto, "publicId" | "startTime" | "endTime">>[];
  selectedId: string;
  onSelect: (id: string) => void;
  disabledIds?: Set<string>;
};

export function TimeSlotGrid({ slots, selectedId, onSelect, disabledIds }: TimeSlotGridProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => (
        <TimeSlotButton
          key={slot.publicId}
          slot={slot}
          isSelected={selectedId === slot.publicId}
          isDisabled={disabledIds?.has(slot.publicId) ?? false}
          onClick={() => onSelect(slot.publicId)}
        />
      ))}
    </div>
  );
}
