import { Card, CardContent } from "@/components/ui/card";
import { ACCENT } from "../ScheduleUtils";

interface StatCardsProps {
  totalSlots: number;
  bookedCount: number;
  availableCount: number;
}

const STATS = (total: number, booked: number, available: number) => [
  { label: "Total Slots", value: total, color: ACCENT },
  { label: "Booked", value: booked, color: "#f59e0b" },
  { label: "Available", value: available, color: "#22c55e" },
];

export function StatCards({ totalSlots, bookedCount, availableCount }: StatCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS(totalSlots, bookedCount, availableCount).map(({ label, value, color }) => (
        <Card key={label} className="relative overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 h-0.5"
            style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
          />
          <CardContent className="pt-4 pb-3 px-5 flex items-center justify-between">
            <p className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground/60">
              {label}
            </p>
            <p className="text-xl font-bold tabular-nums" style={{ color }}>
              {value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
