import { useParams } from "@tanstack/react-router";
import { motion, type Variants } from "framer-motion";
import type * as React from "react";
import { useGetAppointmentByIdForReceptionist } from "@/api/generated/appointments/appointments";
import { Card, CardContent } from "@/components/ui/card";

const ACCENT = "#0d9488";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.22em] uppercase font-semibold text-muted-foreground mb-3 select-none">
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
        {label}
      </span>
      <span className="text-sm font-medium leading-snug">{value}</span>
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

export function ReceptionistApptDetailsPage() {
  const { id } = useParams({ from: "/_protected/appointments/$id" });
  const { data, isLoading, isError } = useGetAppointmentByIdForReceptionist(id);

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
          <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />

          <CardContent className="pt-7 pb-6 px-6 flex flex-col gap-6">
            {/* Identity */}
            <div>
              <Label>Patient</Label>
              <p className="text-2xl font-semibold tracking-tight leading-none mb-1.5">
                {appt.patientName}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground/60 tracking-wider">
                {appt.publicId}
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Visit reason */}
            <div>
              <Label>Visit Reason</Label>
              <p className="text-sm leading-relaxed text-foreground/80">{appt.visitReason}</p>

              {appt.cancellationReason && (
                <div className="mt-4 pl-3 border-l-2 border-destructive/50">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-destructive/70 mb-0.5">
                    Cancellation Note
                  </p>
                  <p className="text-sm text-destructive">{appt.cancellationReason}</p>
                </div>
              )}
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
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 ring-1 ring-border/60"
                      >
                        <span className="text-sm font-medium">{s.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
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

      {/* RIGHT — Doctor & Schedule */}
      <motion.div variants={card} className="h-full">
        <Card className="relative overflow-hidden h-full">
          <div className="absolute top-0 inset-x-0 h-0.75 bg-border" />

          <CardContent className="pt-7 pb-6 px-6 flex flex-col gap-6">
            {/* Doctor identity */}
            <div>
              <Label>Attending Doctor</Label>
              <p className="text-2xl font-semibold tracking-tight leading-none mb-1.5">
                {appt.doctorName}
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {appt.specialization}
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Schedule */}
            <div>
              <Label>Schedule</Label>
              <div className="flex flex-col gap-4">
                <Field label="Date" value={String(appt.date)} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
                    Time
                  </span>
                  <span
                    className="font-mono text-xl font-semibold tracking-tight"
                    style={{ color: ACCENT }}
                  >
                    {String(appt.startTime)}
                    <span className="text-muted-foreground/40 font-normal mx-2 text-base">–</span>
                    {String(appt.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Status */}
            <div>
              <Label>Status</Label>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide"
                style={{
                  borderColor: appt.statusColorCode ?? undefined,
                  color: appt.statusColorCode ?? undefined,
                  backgroundColor: appt.statusColorCode ? `${appt.statusColorCode}12` : undefined,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
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
