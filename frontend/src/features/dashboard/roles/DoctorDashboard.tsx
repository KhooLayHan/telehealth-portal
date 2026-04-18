import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ClipboardPlus, Clock, List, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorScheduleTable } from "./DoctorScheduleTable";
import { formatLocalTime, UseDoctorSchedule } from "./UseDoctorSchedule";

const STAT_CARDS = [
  {
    label: "Today's Patients",
    icon: Users,
    color: "#0d9488",
    bg: "#0d948812",
  },
  {
    label: "Pending Consultations",
    icon: ClipboardPlus,
    color: "#f59e0b",
    bg: "#f59e0b12",
  },
  {
    label: "Next Appointment",
    icon: Clock,
    color: "#3b82f6",
    bg: "#3b82f612",
  },
];

export function DoctorDashboard() {
  const navigate = useNavigate();
  const { schedule, isLoading, page, setPage, search, setSearch, pageSize } = UseDoctorSchedule();

  const totalCount = Number(schedule?.totalCount ?? 0);
  const pendingCount = Number(schedule?.pendingCount ?? 0);
  const nextTime = formatLocalTime(schedule?.nextAppointmentTime ?? undefined);

  const statValues = [totalCount, pendingCount, nextTime];

  return (
    <div className="space-y-6">
      {/* Doctor Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map(({ label, icon: Icon, color, bg }, i) => (
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
                    {isLoading ? (
                      <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" />
                    ) : (
                      statValues[i]
                    )}
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
        ))}
      </div>

      {/* Daily Schedule Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-border border-b px-6 py-4">
          <div>
            <h2 className="font-semibold text-lg">My Schedule (Today)</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Click a patient to view medical history and add notes.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/appointments", search: { today: true } })}
          >
            <List className="mr-2 size-4" /> View Full List
          </Button>
        </div>
        <div className="p-6">
          <DoctorScheduleTable
            items={schedule?.items ?? []}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            search={search}
            isLoading={isLoading}
            hidePagination
            onPageChange={setPage}
            onSearchChange={setSearch}
          />
        </div>
      </div>
    </div>
  );
}
