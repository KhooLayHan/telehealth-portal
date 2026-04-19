import { useMemo } from "react";
import { useGetAllStatuses } from "@/api/generated/appointments/appointments";
import { useGetDailySchedulesForReceptionist } from "@/api/generated/schedules/schedules";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { getTodayStr } from "@/features/schedules/ScheduleUtils";
import { DashboardStatCards } from "./receptionist/DashboardStatCards";
import { ScheduleQueueTable } from "./receptionist/ScheduleQueueTable";

export function ReceptionistDashboard() {
  const today = getTodayStr();

  const { data: scheduleData, isLoading: loadingSlots } = useGetDailySchedulesForReceptionist({
    Date: today,
  });

  const { data: statusData } = useGetAllStatuses();

  const slots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
    () => (scheduleData?.status === 200 ? scheduleData.data : []),
    [scheduleData],
  );

  const statuses = useMemo(() => (statusData?.status === 200 ? statusData.data : []), [statusData]);

  // Only booked slots are shown in the table
  const bookedSlots = useMemo(() => slots.filter((s) => !!s.patientName), [slots]);

  const terminalSlugs = useMemo(
    () => new Set(statuses.filter((s) => s.isTerminal).map((s) => s.slug ?? "")),
    [statuses],
  );

  const inQueueCount = bookedSlots.filter((s) => {
    const slug = statuses.find((st) => st.name === s.appointmentStatus)?.slug ?? "";
    return !terminalSlugs.has(slug);
  }).length;

  const completedCount = bookedSlots.filter(
    (s) => statuses.find((st) => st.name === s.appointmentStatus)?.slug === "completed",
  ).length;

  const cancelledCount = bookedSlots.filter(
    (s) => statuses.find((st) => st.name === s.appointmentStatus)?.slug === "cancelled",
  ).length;

  // Table rows: booked slots only, with sequential queue numbers
  const tableRows = useMemo(
    () =>
      bookedSlots.map((slot, i) => ({
        queueNum: i + 1,
        slot,
      })),
    [bookedSlots],
  );

  return (
    <div className="space-y-6">
      <DashboardStatCards
        totalAppointments={bookedSlots.length}
        inQueueCount={inQueueCount}
        completedCount={completedCount}
        cancelledCount={cancelledCount}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="relative flex items-center justify-between border-b border-border px-5 py-4 overflow-hidden bg-[#0f766e]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)",
            }}
          />
          <div className="relative">
            <h2 className="font-semibold text-sm text-white">Today's Appointments</h2>
            <p className="mt-0.5 text-[11px] text-white/70">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span className="relative rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-xs text-white font-medium">
            {bookedSlots.length} appointment{bookedSlots.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="p-4">
          <ScheduleQueueTable
            rows={tableRows}
            statuses={statuses}
            isLoading={loadingSlots}
            today={today}
          />
        </div>
      </div>
    </div>
  );
}
