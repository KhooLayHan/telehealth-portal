import { motion, type Variants } from "framer-motion";
import { Building2, Check, Clock, Pencil, Settings2, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type Day = (typeof DAYS)[number];

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

type OperatingHours = Record<Day, DaySchedule>;

const DEFAULT_HOURS: OperatingHours = {
  Monday: { open: true, openTime: "09:00", closeTime: "17:00" },
  Tuesday: { open: true, openTime: "09:00", closeTime: "17:00" },
  Wednesday: { open: true, openTime: "09:00", closeTime: "17:00" },
  Thursday: { open: true, openTime: "09:00", closeTime: "17:00" },
  Friday: { open: true, openTime: "09:00", closeTime: "17:00" },
  Saturday: { open: true, openTime: "09:00", closeTime: "13:00" },
  Sunday: { open: false, openTime: "09:00", closeTime: "13:00" },
};

const clinicDetailsSchema = z.object({
  clinicName: z
    .string()
    .min(1, "Clinic name is required")
    .max(100, "Name must be 100 characters or fewer"),
  supportEmail: z.string().email("Please enter a valid email address"),
});

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardAnim: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 select-none font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
      {children}
    </p>
  );
}

function CardEditActions({
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  if (!isEditing) {
    return (
      <Button size="sm" variant="ghost" onClick={onEdit} className="gap-1.5">
        <Pencil className="size-3.5" />
        Edit
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5">
        <X className="size-3.5" />
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} className="gap-1.5">
        <Check className="size-3.5" />
        Save
      </Button>
    </div>
  );
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

export function AdminSettingsPage() {
  // ── Clinic Details ────────────────────────────────────────────
  const [clinicName, setClinicName] = useState("TeleHealth Medical Centre");
  const [supportEmail, setSupportEmail] = useState("support@telehealth.com");
  const [editingClinic, setEditingClinic] = useState(false);
  const [draftClinicName, setDraftClinicName] = useState(clinicName);
  const [draftSupportEmail, setDraftSupportEmail] = useState(supportEmail);
  const [clinicErrors, setClinicErrors] = useState<{
    clinicName?: string;
    supportEmail?: string;
  }>({});

  const handleEditClinic = () => {
    setDraftClinicName(clinicName);
    setDraftSupportEmail(supportEmail);
    setClinicErrors({});
    setEditingClinic(true);
  };

  const handleSaveClinic = () => {
    const result = clinicDetailsSchema.safeParse({
      clinicName: draftClinicName,
      supportEmail: draftSupportEmail,
    });
    if (!result.success) {
      const errors: { clinicName?: string; supportEmail?: string } = {};
      for (const issue of result.error.issues) {
        if (issue.path[0] === "clinicName") errors.clinicName = issue.message;
        if (issue.path[0] === "supportEmail") errors.supportEmail = issue.message;
      }
      setClinicErrors(errors);
      return;
    }
    setClinicName(draftClinicName);
    setSupportEmail(draftSupportEmail);
    setEditingClinic(false);
    toast("Clinic details updated.");
  };

  const handleCancelClinic = () => {
    setEditingClinic(false);
    setClinicErrors({});
  };

  // ── Appointment Duration ──────────────────────────────────────
  const [duration, setDuration] = useState("30");
  const [editingDuration, setEditingDuration] = useState(false);
  const [draftDuration, setDraftDuration] = useState(duration);

  const handleEditDuration = () => {
    setDraftDuration(duration);
    setEditingDuration(true);
  };

  const handleSaveDuration = () => {
    setDuration(draftDuration);
    setEditingDuration(false);
    toast("Appointment duration updated.");
  };

  const handleCancelDuration = () => {
    setEditingDuration(false);
  };

  // ── Operating Hours ───────────────────────────────────────────
  const [hours, setHours] = useState<OperatingHours>(DEFAULT_HOURS);
  const [editingHours, setEditingHours] = useState(false);
  const [draftHours, setDraftHours] = useState<OperatingHours>(hours);

  const handleEditHours = () => {
    setDraftHours(hours);
    setEditingHours(true);
  };

  const handleSaveHours = () => {
    setHours(draftHours);
    setEditingHours(false);
    toast("Operating hours updated.");
  };

  const handleCancelHours = () => {
    setEditingHours(false);
  };

  const updateDraftDay = (day: Day, patch: Partial<DaySchedule>) => {
    setDraftHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], ...patch },
    }));
  };

  return (
    <motion.div
      className="flex max-w-3xl flex-col gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Page header */}
      <motion.div variants={cardAnim}>
        <p className="text-xs text-muted-foreground">Dashboard › Settings</p>
        <h1 className="mt-0.5 font-bold text-2xl tracking-tight">Clinic Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage clinic information, operating hours, and appointment preferences.
        </p>
      </motion.div>

      {/* ── Clinic Details ──────────────────────────────── */}
      <motion.div variants={cardAnim}>
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Building2 className="size-4" />
                </span>
                <CardTitle>Clinic Details</CardTitle>
              </div>
              <CardEditActions
                isEditing={editingClinic}
                onEdit={handleEditClinic}
                onSave={handleSaveClinic}
                onCancel={handleCancelClinic}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Clinic Name</SectionLabel>
                {editingClinic ? (
                  <>
                    <Input
                      value={draftClinicName}
                      onChange={(e) => setDraftClinicName(e.target.value)}
                      placeholder="e.g. TeleHealth Medical Centre"
                      className={
                        clinicErrors.clinicName
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {clinicErrors.clinicName && (
                      <p className="text-destructive text-xs">{clinicErrors.clinicName}</p>
                    )}
                  </>
                ) : (
                  <p className="font-medium text-sm">{clinicName}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <SectionLabel>Support Email</SectionLabel>
                {editingClinic ? (
                  <>
                    <Input
                      value={draftSupportEmail}
                      onChange={(e) => setDraftSupportEmail(e.target.value)}
                      placeholder="e.g. support@clinic.com"
                      type="email"
                      className={
                        clinicErrors.supportEmail
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }
                    />
                    {clinicErrors.supportEmail && (
                      <p className="text-destructive text-xs">{clinicErrors.supportEmail}</p>
                    )}
                  </>
                ) : (
                  <p className="font-medium text-sm">{supportEmail}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Appointment Settings ────────────────────────── */}
      <motion.div variants={cardAnim}>
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Settings2 className="size-4" />
                </span>
                <CardTitle>Appointment Settings</CardTitle>
              </div>
              <CardEditActions
                isEditing={editingDuration}
                onEdit={handleEditDuration}
                onSave={handleSaveDuration}
                onCancel={handleCancelDuration}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Appointment Duration</SectionLabel>
              {editingDuration ? (
                <Select
                  value={draftDuration}
                  onValueChange={(v) => {
                    if (v !== null) setDraftDuration(v);
                  }}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="font-medium text-sm">{duration} minutes per appointment</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Operating Hours ─────────────────────────────── */}
      <motion.div variants={cardAnim}>
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Clock className="size-4" />
                </span>
                <CardTitle>Operating Hours</CardTitle>
              </div>
              <CardEditActions
                isEditing={editingHours}
                onEdit={handleEditHours}
                onSave={handleSaveHours}
                onCancel={handleCancelHours}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-col divide-y">
              {DAYS.map((day) => {
                const schedule = editingHours ? draftHours[day] : hours[day];
                return (
                  <div key={day} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <span className="w-24 shrink-0 font-medium text-sm">{day}</span>
                    {editingHours ? (
                      <>
                        <Switch
                          checked={schedule.open}
                          onCheckedChange={(checked) => updateDraftDay(day, { open: checked })}
                        />
                        {schedule.open ? (
                          <div className="flex flex-1 flex-wrap items-center gap-2">
                            <input
                              type="time"
                              value={schedule.openTime}
                              onChange={(e) => updateDraftDay(day, { openTime: e.target.value })}
                              className="rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                            />
                            <span className="text-muted-foreground text-xs">to</span>
                            <input
                              type="time"
                              value={schedule.closeTime}
                              onChange={(e) => updateDraftDay(day, { closeTime: e.target.value })}
                              className="rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Closed</span>
                        )}
                      </>
                    ) : schedule.open ? (
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs">Open</Badge>
                        <span className="text-muted-foreground text-sm">
                          {formatTime(schedule.openTime)} – {formatTime(schedule.closeTime)}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs text-muted-foreground">
                        Closed
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
