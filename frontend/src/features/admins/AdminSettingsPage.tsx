import { useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Building2, Check, Clock, Pencil, Settings2, X } from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  getAdminGetSettingsQueryKey,
  useAdminGetSettings,
  useAdminUpdateSettings,
} from "@/api/generated/admins/admins";
import type { AdminSettingsDto } from "@/api/model/AdminSettingsDto";
import type { AdminUpdateSettingsCommand } from "@/api/model/AdminUpdateSettingsCommand";
import { ApiError } from "@/api/ofetch-mutator";
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

const clinicDetailsSchema = z.object({
  clinicName: z
    .string()
    .trim()
    .min(1, "Clinic name is required")
    .max(100, "Name must be 100 characters or fewer"),
  supportEmail: z.string().trim().email("Please enter a valid email address"),
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
  disabled = false,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  if (!isEditing) {
    return (
      <Button size="sm" variant="ghost" onClick={onEdit} className="gap-1.5" disabled={disabled}>
        <Pencil className="size-3.5" />
        Edit
      </Button>
    );
  }
  return (
    <div className="flex gap-2">
      <Button size="sm" variant="ghost" onClick={onCancel} className="gap-1.5" disabled={disabled}>
        <X className="size-3.5" />
        Cancel
      </Button>
      <Button size="sm" onClick={onSave} className="gap-1.5" disabled={disabled}>
        <Check className="size-3.5" />
        Save
      </Button>
    </div>
  );
}

function formatTime(t: string): string {
  if (!t) return "Not set";

  const [h, m] = t.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

function toTimeInput(value?: null | string): string {
  return value?.slice(0, 5) ?? "";
}

function toOperatingHours(settings: AdminSettingsDto): OperatingHours {
  const hours = {} as OperatingHours;

  for (const [index, day] of DAYS.entries()) {
    const apiHour = settings.operatingHours.find((hour) => hour.dayOfWeek === index + 1);
    hours[day] = {
      open: apiHour?.isOpen ?? false,
      openTime: toTimeInput(apiHour?.openTime),
      closeTime: toTimeInput(apiHour?.closeTime),
    };
  }

  return hours;
}

function toSettingsCommand(
  settings: AdminSettingsDto,
  hours: OperatingHours,
): AdminUpdateSettingsCommand {
  return {
    clinicName: settings.clinicName,
    supportEmail: settings.supportEmail,
    defaultAppointmentDurationMinutes: settings.defaultAppointmentDurationMinutes,
    operatingHours: DAYS.map((day, index) => {
      const schedule = hours[day];

      return {
        dayOfWeek: index + 1,
        isOpen: schedule.open,
        openTime: schedule.open ? schedule.openTime : null,
        closeTime: schedule.open ? schedule.closeTime : null,
      };
    }),
  };
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useAdminGetSettings();
  const settings = settingsQuery.data?.status === 200 ? settingsQuery.data.data : null;
  const hours = settings ? toOperatingHours(settings) : null;

  const [editingClinic, setEditingClinic] = useState(false);
  const [draftClinicName, setDraftClinicName] = useState("");
  const [draftSupportEmail, setDraftSupportEmail] = useState("");
  const [clinicErrors, setClinicErrors] = useState<{
    clinicName?: string;
    supportEmail?: string;
  }>({});

  const [editingDuration, setEditingDuration] = useState(false);
  const [draftDuration, setDraftDuration] = useState("");

  const [editingHours, setEditingHours] = useState(false);
  const [draftHours, setDraftHours] = useState<OperatingHours | null>(null);

  const { mutateAsync: updateSettings, isPending: isSaving } = useAdminUpdateSettings({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getAdminGetSettingsQueryKey() });
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to update clinic settings.");
          return;
        }

        toast.error("Failed to update clinic settings.");
      },
    },
  });

  const persistSettings = async (
    data: AdminUpdateSettingsCommand,
    successMessage: string,
    onSuccess: () => void,
  ) => {
    try {
      await updateSettings({ data });
      onSuccess();
      toast.success(successMessage);
    } catch {
      return;
    }
  };

  const handleEditClinic = () => {
    if (!settings) return;

    setDraftClinicName(settings.clinicName);
    setDraftSupportEmail(settings.supportEmail);
    setClinicErrors({});
    setEditingClinic(true);
  };

  const handleSaveClinic = async () => {
    if (!(settings && hours)) return;

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

    await persistSettings(
      {
        ...toSettingsCommand(settings, hours),
        clinicName: result.data.clinicName,
        supportEmail: result.data.supportEmail,
      },
      "Clinic details updated.",
      () => setEditingClinic(false),
    );
  };

  const handleCancelClinic = () => {
    setEditingClinic(false);
    setClinicErrors({});
  };

  const handleEditDuration = () => {
    if (!settings) return;

    setDraftDuration(settings.defaultAppointmentDurationMinutes.toString());
    setEditingDuration(true);
  };

  const handleSaveDuration = async () => {
    if (!(settings && hours)) return;

    await persistSettings(
      {
        ...toSettingsCommand(settings, hours),
        defaultAppointmentDurationMinutes: Number(draftDuration),
      },
      "Appointment duration updated.",
      () => setEditingDuration(false),
    );
  };

  const handleCancelDuration = () => {
    setEditingDuration(false);
  };

  const handleEditHours = () => {
    if (!hours) return;

    setDraftHours(hours);
    setEditingHours(true);
  };

  const handleSaveHours = async () => {
    if (!(settings && draftHours)) return;

    await persistSettings(toSettingsCommand(settings, draftHours), "Operating hours updated.", () =>
      setEditingHours(false),
    );
  };

  const handleCancelHours = () => {
    setEditingHours(false);
    setDraftHours(null);
  };

  const updateDraftDay = (day: Day, patch: Partial<DaySchedule>) => {
    setDraftHours((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        [day]: {
          ...prev[day],
          ...patch,
          openTime:
            patch.open === true && !prev[day].openTime
              ? "09:00"
              : (patch.openTime ?? prev[day].openTime),
          closeTime:
            patch.open === true && !prev[day].closeTime
              ? "17:00"
              : (patch.closeTime ?? prev[day].closeTime),
        },
      };
    });
  };

  const isUnavailable = settingsQuery.isLoading || !settings || !hours;

  return (
    <motion.div
      className="flex max-w-3xl flex-col gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={cardAnim}>
        <p className="text-xs text-muted-foreground">Dashboard &gt; Settings</p>
        <h1 className="mt-0.5 font-bold text-2xl tracking-tight">Clinic Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage clinic information, operating hours, and appointment preferences.
        </p>
      </motion.div>

      {settingsQuery.isError ? (
        <motion.div variants={cardAnim}>
          <Card>
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <p className="text-muted-foreground text-sm">Unable to load clinic settings.</p>
              <Button
                variant="outline"
                onClick={() => {
                  void settingsQuery.refetch();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

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
                disabled={isUnavailable || isSaving}
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
                  <p className="font-medium text-sm">
                    {settingsQuery.isLoading ? "Loading..." : settings?.clinicName}
                  </p>
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
                  <p className="font-medium text-sm">
                    {settingsQuery.isLoading ? "Loading..." : settings?.supportEmail}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                disabled={isUnavailable || isSaving}
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
                <p className="font-medium text-sm">
                  {settingsQuery.isLoading
                    ? "Loading..."
                    : settings
                      ? `${settings.defaultAppointmentDurationMinutes} minutes per appointment`
                      : "Unavailable"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

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
                disabled={isUnavailable || isSaving}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {settingsQuery.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading operating hours...</p>
            ) : (
              <div className="flex flex-col divide-y">
                {DAYS.map((day) => {
                  const schedule = editingHours ? draftHours?.[day] : hours?.[day];

                  if (!schedule) return null;

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
                            {formatTime(schedule.openTime)} - {formatTime(schedule.closeTime)}
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
