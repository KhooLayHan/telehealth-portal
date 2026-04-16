import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { CalendarIcon, Plus, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import {
  getGetAppointmentByIdForDoctorQueryKey,
  useGetAppointmentByIdForDoctor,
  useSubmitConsultation,
} from "@/api/generated/appointments/appointments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { formatLocalDate, formatLocalTime } from "@/features/dashboard/roles/UseDoctorSchedule";

const ACCENT = "#0d9488";

const FREQUENCY_CHIPS = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 8 hrs",
  "As needed",
];

// Local types for consultation data (backend returns these but orval schema
// needs a backend restart to pick them up)
type PrescriptionDetail = {
  publicId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  takeWith: string;
  warnings: string[];
  storage: string;
  missedDose: string;
};

type ConsultationDetail = {
  publicId: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  followUpDate?: string | null;
  prescriptions: PrescriptionDetail[];
};

type PrescriptionRow = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  takeWith: string;
  warningInput: string;
  warnings: string[];
  storage: string;
  missedDose: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 select-none font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
      {children}
    </p>
  );
}

function CardLabel({ label, value }: { label: string; value: React.ReactNode }) {
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

const cardAnim: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const formSlide: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function newPrescriptionRow(): PrescriptionRow {
  return {
    id: crypto.randomUUID(),
    medicationName: "",
    dosage: "",
    frequency: "",
    durationDays: "",
    takeWith: "",
    warningInput: "",
    warnings: [],
    storage: "",
    missedDose: "",
  };
}

// ─── Read-only consultation card ───────────────────────────────────────────

function ReadOnlyConsultation({ c }: { c: ConsultationDetail }) {
  return (
    <motion.div
      className="col-span-2 flex flex-col gap-5"
      variants={formSlide}
      initial="hidden"
      animate="show"
    >
      {/* SOAP notes */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
        <CardContent className="px-6 pt-7 pb-6">
          <SectionLabel>Consultation Notes</SectionLabel>
          <div className="grid grid-cols-2 gap-6">
            {(
              [
                ["S — Subjective", c.subjective],
                ["O — Objective", c.objective],
                ["A — Assessment", c.assessment],
                ["P — Plan", c.plan],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
                  {label}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
          {c.followUpDate && (
            <div className="mt-4 flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
                Follow-up Date
              </span>
              <p className="text-sm font-medium">{formatLocalDate(c.followUpDate)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prescriptions read-only */}
      {c.prescriptions.length > 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="px-6 pt-7 pb-6">
            <SectionLabel>Prescriptions</SectionLabel>
            <div className="flex flex-col gap-4">
              {c.prescriptions.map((p) => (
                <div
                  key={p.publicId}
                  className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{p.medicationName}</span>
                    <Badge variant="secondary">{p.durationDays}d</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs text-muted-foreground mb-3">
                    <span>
                      <span className="uppercase tracking-wide text-[10px]">Dosage</span>
                      <br />
                      <span className="text-foreground font-medium">{p.dosage}</span>
                    </span>
                    <span>
                      <span className="uppercase tracking-wide text-[10px]">Frequency</span>
                      <br />
                      <span className="text-foreground font-medium">{p.frequency}</span>
                    </span>
                    <span>
                      <span className="uppercase tracking-wide text-[10px]">Take with</span>
                      <br />
                      <span className="text-foreground font-medium">{p.takeWith}</span>
                    </span>
                  </div>
                  {p.warnings.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.warnings.map((w) => (
                        <Badge key={w} variant="secondary" className="text-xs">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {c.prescriptions.length === 0 && (
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="px-6 pt-7 pb-6">
            <SectionLabel>Prescriptions</SectionLabel>
            <p className="text-sm text-muted-foreground">No prescription issued.</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

// ─── Prescription row ───────────────────────────────────────────────────────

function PrescriptionRowCard({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: PrescriptionRow;
  index: number;
  onChange: (updated: PrescriptionRow) => void;
  onRemove: () => void;
}) {
  function set(field: keyof PrescriptionRow, value: string | string[]) {
    onChange({ ...row, [field]: value });
  }

  function commitWarning() {
    const trimmed = row.warningInput.trim();
    if (!trimmed || row.warnings.includes(trimmed)) {
      onChange({ ...row, warningInput: "" });
      return;
    }
    onChange({ ...row, warnings: [...row.warnings, trimmed], warningInput: "" });
  }

  return (
    <div className="rounded-lg border border-border/70 bg-muted/20 px-4 py-4">
      {/* Row header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-medium text-sm text-muted-foreground">Medicine #{index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Medication Name
          </Label>
          <Input
            placeholder="e.g. Amoxicillin"
            value={row.medicationName}
            onChange={(e) => set("medicationName", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Dosage
          </Label>
          <Input
            placeholder="e.g. 500mg"
            value={row.dosage}
            onChange={(e) => set("dosage", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Frequency
          </Label>
          <Input
            placeholder="e.g. Twice daily"
            value={row.frequency}
            onChange={(e) => set("frequency", e.target.value)}
          />
          <div className="flex flex-wrap gap-1 mt-0.5">
            {FREQUENCY_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => set("frequency", chip)}
                className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:border-[#0d9488] hover:text-[#0d9488] transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Duration (days)
          </Label>
          <Input
            type="number"
            min={1}
            placeholder="e.g. 7"
            value={row.durationDays}
            onChange={(e) => set("durationDays", e.target.value)}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-border/50 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-3">
          Instructions
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Take With
            </Label>
            <Input
              placeholder="e.g. With food"
              value={row.takeWith}
              onChange={(e) => set("takeWith", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Storage
            </Label>
            <Input
              placeholder="e.g. Room temperature"
              value={row.storage}
              onChange={(e) => set("storage", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Missed Dose
            </Label>
            <Input
              placeholder="e.g. Skip if near next dose"
              value={row.missedDose}
              onChange={(e) => set("missedDose", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Warnings
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type a warning and press Enter"
                value={row.warningInput}
                onChange={(e) => set("warningInput", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitWarning();
                  }
                }}
              />
            </div>
            {row.warnings.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {row.warnings.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
                  >
                    {w}
                    <button
                      type="button"
                      onClick={() =>
                        onChange({ ...row, warnings: row.warnings.filter((x) => x !== w) })
                      }
                      className="ml-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function DoctorApptDetailsPage() {
  const { id } = useParams({ from: "/_protected/appointments/$id" });
  const { data, isLoading, isError } = useGetAppointmentByIdForDoctor(id);
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [soap, setSoap] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);
  const [noPrescription, setNoPrescription] = useState(false);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);

  const { mutate: submitConsultation, isPending } = useSubmitConsultation();

  if (isLoading) return <p className="text-muted-foreground text-sm">Loading...</p>;
  if (isError || !data || data.status !== 200) {
    return <p className="text-destructive text-sm">Failed to load appointment.</p>;
  }

  const appt = data.data;
  // Cast to access the consultation field (populated after backend restart picks up schema)
  const consultation = (appt as typeof appt & { consultation?: ConsultationDetail }).consultation;

  const isBooked = appt.status === "Booked";
  const isCompleted = appt.status === "Completed";

  const soapFilled =
    soap.subjective.trim() && soap.objective.trim() && soap.assessment.trim() && soap.plan.trim();

  function handleAddPrescription() {
    setPrescriptions((prev) => [...prev, newPrescriptionRow()]);
  }

  function handleUpdatePrescription(id: string, updated: PrescriptionRow) {
    setPrescriptions((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  function handleRemovePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  }

  function localDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function handleSubmit() {
    submitConsultation(
      {
        id: appt.publicId ?? "",
        data: {
          subjective: soap.subjective,
          objective: soap.objective,
          assessment: soap.assessment,
          plan: soap.plan,
          followUpDate: followUpDate ? localDateString(followUpDate) : null,
          prescriptions: noPrescription
            ? []
            : prescriptions.map((p) => ({
                medicationName: p.medicationName,
                dosage: p.dosage,
                frequency: p.frequency,
                durationDays: Number(p.durationDays),
                instructions: {
                  takeWith: p.takeWith,
                  warnings: p.warnings,
                  storage: p.storage,
                  missedDose: p.missedDose,
                },
              })),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: getGetAppointmentByIdForDoctorQueryKey(appt.publicId ?? ""),
          });
          setShowForm(false);
        },
      },
    );
  }

  return (
    <motion.div
      className="flex flex-col gap-5 max-w-4xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* ── Top 2-col grid ── */}
      <div className="grid grid-cols-2 gap-5">
        {/* LEFT — Patient */}
        <motion.div variants={cardAnim} className="h-full">
          <Card className="relative overflow-hidden h-full">
            <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
            <CardContent className="flex flex-col gap-6 px-6 pt-7 pb-6">
              <div>
                <SectionLabel>Patient</SectionLabel>
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

              <div>
                <SectionLabel>Visit Reason</SectionLabel>
                <p className="text-foreground/80 text-sm leading-relaxed">{appt.visitReason}</p>
              </div>

              {appt.symptoms && appt.symptoms.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <SectionLabel>Symptoms</SectionLabel>
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
        <motion.div variants={cardAnim} className="h-full">
          <Card className="relative overflow-hidden h-full">
            <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
            <CardContent className="flex flex-col gap-6 px-6 pt-7 pb-6">
              <div>
                <SectionLabel>Schedule</SectionLabel>
                <div className="flex flex-col gap-4">
                  <CardLabel label="Date" value={formatLocalDate(String(appt.date ?? ""))} />
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

              <div>
                <SectionLabel>Status</SectionLabel>
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

              {/* Add Consultation Notes button */}
              {isBooked && !showForm && (
                <div className="mt-auto pt-2">
                  <Button
                    className="w-full border-dashed border-[#0d9488] text-[#0d9488] hover:bg-[#0d9488]/5"
                    variant="outline"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus className="size-4 mr-2" />
                    Add Consultation Notes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Completed read-only view ── */}
      {isCompleted && consultation && <ReadOnlyConsultation c={consultation} />}

      {/* ── Consultation form (Booked only) ── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* CARD 1 — Consultation Notes */}
            <motion.div
              key="soap-card"
              variants={formSlide}
              initial="hidden"
              animate="show"
              exit="exit"
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
                <CardContent className="px-6 pt-7 pb-6">
                  <SectionLabel>Consultation Notes</SectionLabel>
                  <div className="grid grid-cols-2 gap-5">
                    {(
                      [
                        ["subjective", "S — Subjective", "What does the patient report?"],
                        ["objective", "O — Objective", "Clinical observations, vitals"],
                        ["assessment", "A — Assessment", "Diagnosis"],
                        ["plan", "P — Plan", "Treatment plan"],
                      ] as [keyof typeof soap, string, string][]
                    ).map(([field, label, placeholder]) => (
                      <div key={field} className="flex flex-col gap-1.5">
                        <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          {label}
                        </Label>
                        <Textarea
                          placeholder={placeholder}
                          className="min-h-[80px] resize-y"
                          value={soap[field]}
                          onChange={(e) =>
                            setSoap((prev) => ({ ...prev, [field]: e.target.value }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  {/* Follow-up date */}
                  <div className="mt-5 flex flex-col gap-1 max-w-xs">
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Follow-up Date
                    </Label>
                    <p className="text-xs text-muted-foreground/70 mb-1">
                      Optional — leave blank if no follow-up needed
                    </p>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button variant="outline" className="w-full justify-start font-normal">
                            <CalendarIcon className="size-4 mr-2 text-muted-foreground" />
                            {followUpDate
                              ? followUpDate.toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Pick a date"}
                          </Button>
                        }
                      />
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={followUpDate}
                          onSelect={setFollowUpDate}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* CARD 2 — Prescriptions */}
            <motion.div
              key="rx-card"
              variants={formSlide}
              initial="hidden"
              animate="show"
              exit="exit"
              style={{ transition: "all 0.35s ease-out 0.07s" }}
            >
              <Card className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
                <CardContent className="px-6 pt-7 pb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <SectionLabel>Prescriptions</SectionLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setNoPrescription((prev) => !prev);
                        if (!noPrescription) setPrescriptions([]);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        noPrescription
                          ? "border-[#0d9488] bg-[#0d9488]/10 text-[#0d9488]"
                          : "border-border text-muted-foreground hover:border-[#0d9488]/50 hover:text-[#0d9488]"
                      }`}
                    >
                      No Prescription Needed
                    </button>
                  </div>

                  {noPrescription ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No prescription will be issued for this consultation.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-col gap-4">
                        <AnimatePresence>
                          {prescriptions.map((row, index) => (
                            <motion.div
                              key={row.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.97 }}
                              transition={{ duration: 0.2 }}
                            >
                              <PrescriptionRowCard
                                row={row}
                                index={index}
                                onChange={(updated) => handleUpdatePrescription(row.id, updated)}
                                onRemove={() => handleRemovePrescription(row.id)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-4 w-full border-dashed"
                        onClick={handleAddPrescription}
                      >
                        <Plus className="size-4 mr-2" />
                        Add Medicine
                      </Button>
                    </>
                  )}

                  {/* Footer — Mark as Completed */}
                  <div className="mt-6 flex justify-end">
                    <Button
                      disabled={!soapFilled || isPending}
                      onClick={handleSubmit}
                      className="bg-[#0d9488] text-white hover:bg-[#0b857a] px-6"
                    >
                      {isPending ? "Saving..." : "Mark as Completed"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
