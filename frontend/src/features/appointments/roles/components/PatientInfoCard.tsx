import type { ReceptionistAppointmentDetailDto } from "@/api/model/ReceptionistAppointmentDetailDto";
import { Card, CardContent } from "@/components/ui/card";
import { ACCENT } from "./Constants";
import { SectionLabel } from "./SectionLabel";
import { StatusBadge } from "./StatusBadge";

function severityColor(severity: string | null | undefined) {
  if (!severity) return "#94a3b8";
  const s = severity.toLowerCase();
  if (s === "severe" || s === "high") return "#ef4444";
  if (s === "moderate" || s === "medium") return "#f59e0b";
  return "#22c55e";
}

export function PatientInfoCard({
  appointment,
  isTerminal,
}: {
  appointment: ReceptionistAppointmentDetailDto;
  isTerminal: boolean;
}) {
  return (
    <Card className="relative overflow-hidden h-full">
      <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />
      <CardContent className="pt-7 pb-6 px-6 flex flex-col gap-6">
        {/* Patient + status badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <SectionLabel>Patient</SectionLabel>
            <p className="text-2xl font-semibold tracking-tight leading-none mb-1.5">
              {appointment.patientName}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/60 tracking-wider">
              {appointment.publicId}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 pt-1">
            <StatusBadge
              name={appointment.status ?? "Unknown"}
              colorCode={appointment.statusColorCode || ACCENT}
            />
            {isTerminal && (
              <span className="text-[10px] text-muted-foreground/60 tracking-wide">Read-only</span>
            )}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Visit reason */}
        <div>
          <SectionLabel>Visit Reason</SectionLabel>
          <p className="text-sm leading-relaxed text-foreground/80">{appointment.visitReason}</p>
        </div>

        {/* Symptoms */}
        {appointment.symptoms && appointment.symptoms.length > 0 && (
          <>
            <div className="h-px bg-border" />
            <div>
              <SectionLabel>Symptoms</SectionLabel>
              <div className="flex flex-col gap-2">
                {appointment.symptoms.map((s) => (
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
  );
}
