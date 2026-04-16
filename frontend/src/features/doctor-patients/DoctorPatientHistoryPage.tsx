import { Link, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Pill,
  User,
} from "lucide-react";
import { useState } from "react";
import { useGetDoctorPatientAppointments } from "@/api/generated/doctors/doctors";
import type { ConsultationSummaryDto } from "@/api/model/ConsultationSummaryDto";
import type { DoctorPatientAppointmentDto } from "@/api/model/DoctorPatientAppointmentDto";
import type { PrescriptionSummaryDto } from "@/api/model/PrescriptionSummaryDto";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatLocalDate, formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

const ACCENT = "#0d9488";

function PrescriptionCard({ rx }: { rx: PrescriptionSummaryDto }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pill className="size-4 shrink-0" style={{ color: ACCENT }} />
          <span className="font-semibold text-sm">{rx.medicationName}</span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{rx.durationDays}d</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
        <div>
          <span className="text-muted-foreground">Dosage</span>
          <p className="font-medium mt-0.5">{rx.dosage}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Frequency</span>
          <p className="font-medium mt-0.5">{rx.frequency}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Take with</span>
          <p className="font-medium mt-0.5">{rx.takeWith}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Storage</span>
          <p className="font-medium mt-0.5">{rx.storage}</p>
        </div>
        {rx.missedDose && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Missed dose</span>
            <p className="font-medium mt-0.5">{rx.missedDose}</p>
          </div>
        )}
        {(rx.warnings?.length ?? 0) > 0 && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Warnings</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {rx.warnings!.map((w) => (
                <span
                  key={w}
                  className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] text-amber-700"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
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
    <div className="space-y-4 pt-1">
      {/* SOAP Notes */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="size-4" style={{ color: ACCENT }} />
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">
            Consultation Notes
          </span>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {soapFields.map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {f.label}
              </p>
              <p className="text-sm leading-relaxed">{f.value || "—"}</p>
            </div>
          ))}
        </div>
        {consultation.followUpDate && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
            <Calendar className="size-3" />
            Follow-up: {formatLocalDate(String(consultation.followUpDate))}
          </p>
        )}
      </div>

      {/* Prescriptions */}
      {(consultation.prescriptions?.length ?? 0) > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pill className="size-4" style={{ color: ACCENT }} />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-muted-foreground">
              Prescriptions ({consultation.prescriptions!.length})
            </span>
          </div>
          <div className="space-y-2">
            {consultation.prescriptions!.map((rx) => (
              <PrescriptionCard key={rx.publicId} rx={rx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appt, index }: { appt: DoctorPatientAppointmentDto; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const hasConsultation = Boolean(appt.consultation);
  const color = appt.statusColorCode || ACCENT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
    >
      <Card className="overflow-hidden border-border">
        {/* Card header row */}
        <button
          type="button"
          className="flex w-full items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-muted/30 transition-colors text-left"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-4">
            {/* Date block */}
            <div className="text-center min-w-[48px]">
              <p className="text-xs text-muted-foreground font-medium">
                {String(appt.date)?.slice(5, 7)}/{String(appt.date)?.slice(0, 4)}
              </p>
              <p className="text-xl font-bold leading-none">{String(appt.date)?.slice(8, 10)}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <p className="font-medium text-sm leading-tight">{appt.visitReason}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatLocalTime(appt.startTime)} – {formatLocalTime(appt.endTime)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold"
              style={{
                borderColor: color,
                color: color,
                backgroundColor: `${color}18`,
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
              transition={{ duration: 0.2, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <Separator />
              <div className="px-5 py-4 space-y-4">
                {/* Symptoms */}
                {(appt.symptoms?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Symptoms
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {appt.symptoms!.map((s) => (
                        <span
                          key={s.name}
                          className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-xs"
                        >
                          <AlertCircle className="size-3 text-muted-foreground" />
                          {s.name}
                          {s.severity && (
                            <span className="text-muted-foreground">· {s.severity}</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultation */}
                {hasConsultation ? (
                  <ConsultationSection consultation={appt.consultation!} />
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No consultation notes recorded.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export function DoctorPatientHistoryPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id } = useParams({ strict: false }) as any;
  const { data, isLoading, isError } = useGetDoctorPatientAppointments(id);

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/patients"
          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Patients
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          {isLoading ? "Loading..." : patientName}
        </span>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <User className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-destructive">Failed to load patient history.</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="h-4 w-8 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-10 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Page title */}
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
              style={{ color: ACCENT }}
            >
              Patient History
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{patientName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {appointments.length} appointment{appointments.length !== 1 ? "s" : ""} on record ·
              latest first
            </p>
          </div>

          {/* Appointment list */}
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <Calendar className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No appointments found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((appt, i) => (
                <AppointmentCard key={appt.publicId} appt={appt} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
