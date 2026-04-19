import { motion } from "framer-motion";
import { Clock, User } from "lucide-react";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import { formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";
import { ACCENT, isSlotNow } from "../ScheduleUtils";
import { StatusPill } from "./StatusPill";

export function SlotRow({
  slot,
  isToday,
  index,
}: {
  slot: ReceptionistDoctorScheduleSlotDto;
  isToday: boolean;
  index: number;
}) {
  const scheduleColor = slot.scheduleStatusColorCode || ACCENT;
  const isBooked = !!slot.patientName;
  const active = isToday && isSlotNow(String(slot.startTime), String(slot.endTime));

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.018, duration: 0.22 }}
      className="relative"
    >
      {/* Pulsing NOW indicator dot to the left of the row */}
      {active && (
        <span className="absolute -left-1 top-1/2 -translate-y-1/2 flex size-2 z-10">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
            style={{ background: scheduleColor }}
          />
          <span
            className="relative inline-flex rounded-full size-2"
            style={{ background: scheduleColor }}
          />
        </span>
      )}

      {/* Row card — overflow-hidden clips the left accent bar flush with rounded corners */}
      <div
        className={`relative flex items-center gap-3 rounded-lg border overflow-hidden px-3 py-2.5 transition-colors ${
          active
            ? "shadow-sm border-border/80"
            : "border-border/80 hover:bg-muted/50 hover:border-border/80"
        }`}
        style={active ? { background: `${scheduleColor}08` } : {}}
      >
        {/* Colored left accent bar — clipped cleanly by overflow-hidden + rounded-lg */}
        <div className="absolute left-0 inset-y-0 w-0.75" style={{ background: scheduleColor }} />

        {/* Time */}
        <div className="shrink-0 w-32">
          <p className="text-xs font-mono font-semibold leading-tight">
            {formatLocalTime(String(slot.startTime))} – {formatLocalTime(String(slot.endTime))}
          </p>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Doctor */}
        <div className="shrink-0 w-44 min-w-0">
          <p className="text-xs font-semibold truncate leading-tight">{slot.doctorName}</p>
          {slot.doctorSpecialization && (
            <p className="text-[10px] text-muted-foreground truncate leading-tight">
              {slot.doctorSpecialization}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border shrink-0" />

        {/* Patient / availability */}
        <div className="flex-1 min-w-0">
          {isBooked ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="size-3 shrink-0 text-muted-foreground" />
              <span className="text-xs font-medium truncate">{slot.patientName}</span>
              {slot.visitReason && (
                <span className="text-[11px] text-muted-foreground truncate hidden sm:block">
                  · {slot.visitReason}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground/50">
              <Clock className="size-3 shrink-0" />
              <span className="text-xs italic">Available</span>
            </div>
          )}
        </div>

        {/* Status pills */}
        <div className="shrink-0 flex items-center gap-1.5 ml-auto">
          {active && (
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: `${scheduleColor}20`, color: scheduleColor }}
            >
              NOW
            </span>
          )}
          {isBooked && slot.appointmentStatus ? (
            <StatusPill label={slot.appointmentStatus} color={slot.appointmentStatusColorCode} />
          ) : (
            <StatusPill label={slot.scheduleStatus ?? "—"} color={slot.scheduleStatusColorCode} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
