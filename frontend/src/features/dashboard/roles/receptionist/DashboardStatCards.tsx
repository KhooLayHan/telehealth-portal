import { motion } from "framer-motion";
import { CalendarCheck, CheckCircle2, Hash, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStatCardsProps {
  totalAppointments: number;
  inQueueCount: number;
  completedCount: number;
  cancelledCount: number;
}

const STATS = (total: number, queue: number, completed: number, cancelled: number) => [
  {
    label: "Today's Appointments",
    value: total,
    icon: CalendarCheck,
    color: "#0d9488",
    bg: "#0d948812",
  },
  {
    label: "In Queue",
    value: queue,
    icon: Hash,
    color: "#8b5cf6",
    bg: "#8b5cf612",
  },
  {
    label: "Completed",
    value: completed,
    icon: CheckCircle2,
    color: "#22c55e",
    bg: "#22c55e12",
  },
  {
    label: "Cancelled",
    value: cancelled,
    icon: XCircle,
    color: "#ef4444",
    bg: "#ef444412",
  },
];

export function DashboardStatCards({
  totalAppointments,
  inQueueCount,
  completedCount,
  cancelledCount,
}: DashboardStatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATS(totalAppointments, inQueueCount, completedCount, cancelledCount).map(
        ({ label, value, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.25 }}
          >
            <Card className="relative overflow-hidden">
              <div
                className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${color}, transparent)` }}
              />
              <CardContent className="flex items-center justify-between px-4 pb-3 pt-4">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    {label}
                  </p>
                  <p className="text-2xl font-bold tabular-nums" style={{ color }}>
                    {value}
                  </p>
                </div>
                <div
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ background: bg }}
                >
                  <Icon className="size-4" style={{ color }} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ),
      )}
    </div>
  );
}
