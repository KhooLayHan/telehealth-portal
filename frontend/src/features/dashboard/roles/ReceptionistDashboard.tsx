import { useMemo } from "react";
import { useGetAllStatuses } from "@/api/generated/appointments/appointments";
import { useGetDailySchedulesForReceptionist } from "@/api/generated/schedules/schedules";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { getTodayStr } from "@/features/schedules/ScheduleUtils";
import { DashboardStatCards } from "./receptionist/DashboardStatCards";
import { buildQueue, PatientQueueWidget } from "./receptionist/PatientQueueWidget";
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

  // --- Derived stats ---
  const bookedSlots = useMemo(() => slots.filter((s) => !!s.patientName), [slots]);
  const availableCount = slots.length - bookedSlots.length;

  // "In Queue" = booked appointments that aren't completed or cancelled
  const terminalNames = useMemo(
    () => new Set(statuses.filter((s) => s.isTerminal).map((s) => s.name?.toLowerCase() ?? "")),
    [statuses],
  );
  const activeQueueCount = bookedSlots.filter(
    (s) => !terminalNames.has(s.appointmentStatus?.toLowerCase() ?? ""),
  ).length;

  // --- Queue entries (booked slots ordered by time, numbered) ---
  const queueEntries = useMemo(() => buildQueue(slots, true), [slots]);

  // --- Table rows (all slots, with queue num for booked ones) ---
  const tableRows = useMemo(() => {
    let queueNum = 0;
    return slots.map((slot) => {
      if (slot.patientName) {
        queueNum += 1;
        return { queueNum, slot };
      }
      return { queueNum: null, slot };
    });
  }, [slots]);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <DashboardStatCards
        totalSlots={slots.length}
        bookedCount={bookedSlots.length}
        availableCount={availableCount}
        activeQueueCount={activeQueueCount}
      />

      {/* Patient queue widget */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-semibold text-sm">Patient Queue</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Today's appointments in order — {queueEntries.length} patient
            {queueEntries.length !== 1 ? "s" : ""} booked
          </p>
        </div>
        <div className="p-4">
          <PatientQueueWidget queue={queueEntries} isToday={true} />
        </div>
      </div>

      {/* Full schedule table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <h2 className="font-semibold text-sm">Today's Schedule</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              All slots for{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {slots.length} slot{slots.length !== 1 ? "s" : ""}
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
