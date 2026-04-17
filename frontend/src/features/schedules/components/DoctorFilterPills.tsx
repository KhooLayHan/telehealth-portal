import { Stethoscope } from "lucide-react";
import { ACCENT } from "../ScheduleUtils";

interface DoctorInfo {
  name: string;
  specialization: string;
  total: number;
  booked: number;
}

interface DoctorFilterPillsProps {
  doctors: Map<string, DoctorInfo>;
  totalSlots: number;
  selectedDoctor: string | null;
  onSelect: (id: string | null) => void;
}

export function DoctorFilterPills({
  doctors,
  totalSlots,
  selectedDoctor,
  onSelect,
}: DoctorFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {/* "All doctors" pill */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
          !selectedDoctor
            ? "border-transparent text-white"
            : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        }`}
        style={!selectedDoctor ? { background: ACCENT } : {}}
      >
        All doctors
        <span
          className={`text-[10px] font-bold tabular-nums ${!selectedDoctor ? "text-white/80" : "text-muted-foreground"}`}
        >
          {totalSlots}
        </span>
      </button>

      {/* Per-doctor pills */}
      {Array.from(doctors.entries()).map(([id, doc]) => {
        const active = selectedDoctor === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onSelect(active ? null : id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              active
                ? "border-transparent text-white"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
            style={active ? { background: ACCENT } : {}}
          >
            <Stethoscope className="size-3 shrink-0" />
            <span className="truncate max-w-32">{doc.name}</span>
            <span
              className={`text-[10px] font-bold tabular-nums ${active ? "text-white/80" : "text-muted-foreground"}`}
            >
              {doc.booked}/{doc.total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
