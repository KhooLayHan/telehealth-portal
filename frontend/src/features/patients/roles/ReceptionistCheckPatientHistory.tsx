import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Pill,
  Stethoscope,
  User,
} from "lucide-react";
import { useState } from "react";
import { useReceptionistGetPatientHistory } from "@/api/generated/patients/patients";
import type { ConsultationSummaryDto } from "@/api/model/ConsultationSummaryDto";
import type { PrescriptionSummaryDto } from "@/api/model/PrescriptionSummaryDto";
import type { ReceptionistPatientAppointmentDto } from "@/api/model/ReceptionistPatientAppointmentDto";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatLocalDate, formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

const ACCENT = "#0d9488";

function PrescriptionCard({ rx }: { rx: PrescriptionSummaryDto }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${ACCENT}18` }}
          >
            <Pill className="size-3.5" style={{ color: ACCENT }} />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{rx.medicationName}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
              {rx.dosage}
            </p>
          </div>
        </div>
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md"
          style={{ background: `${ACCENT}15`, color: ACCENT }}
        >
          {rx.durationDays}d
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs pt-1">
        <div>
          <p className="text-muted-foreground mb-0.5">Frequency</p>
          <p className="font-medium">{rx.frequency}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Take with</p>
          <p className="font-medium">{rx.takeWith}</p>
        </div>
        <div>
          <p className="text-muted-foreground mb-0.5">Storage</p>
          <p className="font-medium">{rx.storage}</p>
        </div>
        {rx.missedDose && (
          <div>
            <p className="text-muted-foreground mb-0.5">Missed dose</p>
            <p className="font-medium">{rx.missedDose}</p>
          </div>
        )}
      </div>

      {(rx.warnings?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 pt-1 border-t border-border">
          {rx.warnings?.map((w) => (
            <span
              key={w}
              className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700"
            >
              ⚠ {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ConsultationSection({ consultation }: { consultation: ConsultationSummaryDto }) {
  const soapFields = [
    { label: "S — Subjective", value: consultation.subjective },
    { label: "O — Objective", value: consultation.objective },
    { label: "A — Assessment", value: consultation.assessment },
    { label: "P — Plan", value: consultation.plan },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `${ACCENT}18` }}
          >
            <ClipboardList className="size-3.5" style={{ color: ACCENT }} />
          </div>
          <span
            className="text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ color: ACCENT }}
          >
            Consultation Notes
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {soapFields.map((f) => (
            <div key={f.label} className="rounded-xl border border-border bg-muted/20 p-3.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                {f.label}
              </p>
              <p className="text-sm leading-relaxed">{f.value || "—"}</p>
            </div>
          ))}
        </div>
        {consultation.followUpDate && (
          <div
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium"
            style={{
              borderColor: `${ACCENT}40`,
              background: `${ACCENT}0a`,
              color: ACCENT,
            }}
          >
            <Calendar className="size-3.5 shrink-0" />
            Follow-up scheduled: {formatLocalDate(String(consultation.followUpDate))}
          </div>
        )}
      </div>

      {(consultation.prescriptions?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "#f59e0b18" }}
            >
              <Pill className="size-3.5 text-amber-500" />
            </div>
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-amber-600">
              Prescriptions ({consultation.prescriptions?.length})
            </span>
          </div>
          <div className="space-y-2">
            {consultation.prescriptions?.map((rx) => (
              <PrescriptionCard key={rx.publicId} rx={rx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({
  appt,
  index,
}: {
  appt: ReceptionistPatientAppointmentDto;
  index: number;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  const hasConsultation = Boolean(appt.consultation);
  const color = appt.statusColorCode || ACCENT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
    >
      <Card className="overflow-hidden border-border shadow-sm">
        {/* Colour accent line matching status */}
        <div className="h-0.5 w-full" style={{ background: color }} />

        {/* Header row — clickable */}
        <button
          type="button"
          className="flex w-full items-start justify-between gap-4 px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors text-left"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {/* Date block */}
          <div
            className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl border"
            style={{ borderColor: `${color}50`, background: `${color}10` }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color }}>
              {String(appt.date)?.slice(5, 7)}/{String(appt.date)?.slice(2, 4)}
            </p>
            <p className="text-lg font-bold leading-tight" style={{ color }}>
              {String(appt.date)?.slice(8, 10)}
            </p>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <p className="font-semibold text-sm leading-tight truncate">{appt.visitReason}</p>

            {/* Doctor row */}
            {appt.doctorName && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="size-3 shrink-0" />
                <span className="font-medium">{appt.doctorName}</span>
                {appt.doctorSpecialization && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                    <span>{appt.doctorSpecialization}</span>
                  </>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground font-mono">
              {formatLocalTime(appt.startTime)} – {formatLocalTime(appt.endTime)}
            </p>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                borderColor: `${color}60`,
                color,
                backgroundColor: `${color}15`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              {appt.status ?? "—"}
            </span>
            {expanded ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <Separator />
              <div className="px-5 py-5 space-y-5">
                {/* Consultation */}
                {hasConsultation ? (
                  <ConsultationSection consultation={appt.consultation!} />
                ) : (
                  <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground/60 italic">
                    <ClipboardList className="size-3.5 shrink-0" />
                    No consultation notes recorded.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function ReceptionistCheckPatientHistory() {
  const { id } = useParams({ from: "/_protected/patients/$id/history" });
  const { data, isLoading, isError } = useReceptionistGetPatientHistory(id);

  const result = data?.status === 200 ? data.data : null;
  const patientName = result?.patientName ?? "Patient";
  const appointments = result?.items ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {isError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <User className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-destructive">Failed to load patient history.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <div className="h-0.5 w-full bg-muted animate-pulse" />
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
                style={{ color: ACCENT }}
              >
                Visit History
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">{patientName}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} on record ·
                latest first
              </p>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Calendar className="size-10 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">No appointments on record.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt: ReceptionistPatientAppointmentDto, i: number) => (
                <AppointmentCard key={appt.publicId} appt={appt} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
