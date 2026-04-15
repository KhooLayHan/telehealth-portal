import { useParams } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import type * as React from "react";
import { useGetAppointmentByIdForDoctor } from "@/api/generated/appointments/appointments";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatLocalDate, formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

const ACCENT = "#0d9488";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 select-none font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <span className="font-medium text-sm leading-snug">{value}</span>
    </div>
  );
}

function severityColor(severity: string | null | undefined) {
  if (!severity) return "#94a3b8";
  const s = severity.toLowerCase();
  if (s === "severe" || s === "high") return "#ef4444";
  if (s === "moderate" || s === "medium") return "#f59e0b";
  return "#22c55e";
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function DoctorApptDetailsPage() {
  const { id } = useParams({ from: "/_protected/appointments/$id" });
  const { data, isLoading, isError } = useGetAppointmentByIdForDoctor(id);

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (isError || !data || data.status !== 200) {
    return <p className="text-destructive text-sm">Failed to load appointment.</p>;
  }

  const appt = data.data;

  return (
    <motion.div
      className="grid grid-cols-2 gap-5 max-w-4xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* LEFT — Patient */}
      <motion.div variants={card} className="h-full">
        <Card className="relative overflow-hidden h-full">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
          <CardContent className="flex flex-col gap-6 px-6 pt-7 pb-6">
            {/* Identity */}
            <div>
              <Label>Patient</Label>
              <p className="mb-1.5 font-semibold text-2xl leading-none tracking-tight">
                {appt.patientName}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{appt.patientGender ?? "—"}</Badge>
                <span className="text-muted-foreground text-xs">
                  {appt.patientAge != null ? `${appt.patientAge} yrs old` : "—"}
                </span>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Visit reason */}
            <div>
              <Label>Visit Reason</Label>
              <p className="text-foreground/80 text-sm leading-relaxed">{appt.visitReason}</p>
            </div>

            {/* Symptoms */}
            {appt.symptoms && appt.symptoms.length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <Label>Symptoms</Label>
                  <div className="flex flex-col gap-2">
                    {appt.symptoms.map((s) => (
                      <div
                        key={`${s.name}-${s.severity}`}
                        className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 ring-1 ring-border/60"
                      >
                        <span className="font-medium text-sm">{s.name}</span>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: severityColor(s.severity) }}
                            />
                            {s.severity}
                          </span>
                          {s.duration && (
                            <>
                              <span className="opacity-30">·</span>
                              <span>{s.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* RIGHT — Schedule & Status */}
      <motion.div variants={card} className="h-full">
        <Card className="relative overflow-hidden h-full">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="flex flex-col gap-6 px-6 pt-7 pb-6">
            {/* Schedule */}
            <div>
              <Label>Schedule</Label>
              <div className="flex flex-col gap-4">
                <Field label="Date" value={formatLocalDate(String(appt.date ?? ""))} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
                    Time
                  </span>
                  <span
                    className="font-semibold text-xl tracking-tight font-mono"
                    style={{ color: ACCENT }}
                  >
                    {formatLocalTime(String(appt.startTime ?? ""))}
                    <span className="mx-2 font-normal text-base text-muted-foreground/40">–</span>
                    {formatLocalTime(String(appt.endTime ?? ""))}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Status */}
            <div>
              <Label>Status</Label>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-xs tracking-wide"
                style={{
                  borderColor: appt.statusColorCode ?? undefined,
                  color: appt.statusColorCode ?? undefined,
                  backgroundColor: appt.statusColorCode ? `${appt.statusColorCode}12` : undefined,
                }}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: appt.statusColorCode ?? undefined }}
                />
                {appt.status}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
