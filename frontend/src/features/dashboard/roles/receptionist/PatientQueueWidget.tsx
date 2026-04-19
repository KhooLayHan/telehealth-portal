import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

interface QueueEntry {
  queueNum: number;
  slot: ReceptionistDoctorScheduleSlotDto;
  isNow: boolean;
  isNext: boolean;
}

interface PatientQueueWidgetProps {
  queue: QueueEntry[];
  isToday: boolean;
}

export function PatientQueueWidget({ queue, isToday }: PatientQueueWidgetProps) {
  if (queue.length === 0) {
    return (
      <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        No patients booked today
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {queue.map(({ queueNum, slot, isNow, isNext }, i) => (
        <motion.div
          key={slot.publicId}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          className="relative shrink-0"
        >
          {/* Pulsing ring for NOW */}
          {isNow && (
            <span className="absolute -inset-0.5 rounded-xl">
              <span
                className="absolute inset-0 animate-ping rounded-xl opacity-20"
                style={{ background: "#0d9488" }}
              />
            </span>
          )}

          <div
            className={`relative flex min-w-44 flex-col gap-1.5 rounded-xl border px-3.5 py-3 ${
              isNow
                ? "border-transparent text-white"
                : isNext
                  ? "border-[#0d9488]/40 bg-[#0d9488]/5"
                  : "border-border bg-card"
            }`}
            style={isNow ? { background: "#0d9488" } : {}}
          >
            {/* Queue number + badge */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold tabular-nums ${isNow ? "text-white/70" : "text-muted-foreground"}`}
              >
                #{queueNum}
              </span>
              {isNow && isToday ? (
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                  <span className="size-1.5 rounded-full bg-white" />
                  NOW
                </span>
              ) : isNext && isToday ? (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{ background: "#0d948820", color: "#0d9488" }}
                >
                  NEXT
                </span>
              ) : null}
            </div>

            {/* Patient name */}
            <p
              className={`truncate text-xs font-semibold leading-tight ${isNow ? "text-white" : "text-foreground"}`}
            >
              {slot.patientName ?? "—"}
            </p>

            {/* Time + Doctor */}
            <div
              className={`flex items-center gap-1 text-[10px] ${isNow ? "text-white/70" : "text-muted-foreground"}`}
            >
              <Clock className="size-2.5 shrink-0" />
              <span className="font-mono">{formatLocalTime(String(slot.startTime))}</span>
              <span className="mx-0.5 opacity-50">·</span>
              <span className="truncate">{slot.doctorName?.replace("Dr. ", "Dr.")}</span>
            </div>

            {/* Appointment status dot */}
            {slot.appointmentStatus && (
              <div className="flex items-center gap-1">
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: slot.appointmentStatusColorCode ?? "#94a3b8" }}
                />
                <span
                  className={`text-[10px] font-medium ${isNow ? "text-white/80" : "text-muted-foreground"}`}
                >
                  {slot.appointmentStatus}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
