import { useQueryClient } from "@tanstack/react-query";
import { motion, type Variants } from "framer-motion";
import { Building2, Check, Clock, LoaderCircle, Pencil, Settings2, X } from "lucide-react";
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

// Lists the supported appointment slot lengths admins can save.
const DURATION_OPTIONS = [15, 30, 45, 60] as const;

// Matches the browser time input format before sending LocalTime values to the API.
const TIME_INPUT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type Day = (typeof DAYS)[number];

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

type OperatingHours = Record<Day, DaySchedule>;

// Stores field-level validation messages for clinic details.
type ClinicErrors = {
  clinicName?: string;
  supportEmail?: string;
};

// Stores per-day validation messages for editable operating hours.
type HoursErrors = Partial<Record<Day, string>>;

const clinicDetailsSchema = z.object({
  clinicName: z
    .string()
    .trim()
    .min(1, "Clinic name is required")
    .max(100, "Name must be 100 characters or fewer"),
  supportEmail: z.string().trim().email("Please enter a valid email address"),
});

// Validates that appointment duration stays within the choices exposed in the UI.
const appointmentDurationSchema = z.coerce
  .number()
  .int()
  .refine(
    (value) => DURATION_OPTIONS.includes(value as (typeof DURATION_OPTIONS)[number]),
    "Choose a supported appointment duration",
  );

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
  isSaving = false,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
  isSaving?: boolean;
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
        {isSaving ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        {isSaving ? "Saving" : "Save"}
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

// Converts time input values back to the LocalTime JSON format accepted by the API.
function toApiLocalTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
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
        openTime: schedule.open ? toApiLocalTime(schedule.openTime) : null,
        closeTime: schedule.open ? toApiLocalTime(schedule.closeTime) : null,
      };
    }),
  };
}

// Validates editable opening hours before sending them to the settings endpoint.
function validateOperatingHours(hours: OperatingHours): HoursErrors {
  const errors: HoursErrors = {};

  for (const day of DAYS) {
    const schedule = hours[day];

    if (!schedule.open) {
      continue;
    }

    if (
      !TIME_INPUT_PATTERN.test(schedule.openTime) ||
      !TIME_INPUT_PATTERN.test(schedule.closeTime)
    ) {
      errors[day] = "Enter an opening and closing time.";
      continue;
    }

    if (schedule.closeTime <= schedule.openTime) {
      errors[day] = "Closing time must be after opening time.";
    }
  }

  return errors;
}

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const settingsQuery = useAdminGetSettings();
  const settings = settingsQuery.data?.status === 200 ? settingsQuery.data.data : null;
  const hours = settings ? toOperatingHours(settings) : null;

  const [editingClinic, setEditingClinic] = useState(false);
  const [draftClinicName, setDraftClinicName] = useState("");
  const [draftSupportEmail, setDraftSupportEmail] = useState("");
  const [clinicErrors, setClinicErrors] = useState<ClinicErrors>({});

  const [editingDuration, setEditingDuration] = useState(false);
  const [draftDuration, setDraftDuration] = useState("");
  const [durationError, setDurationError] = useState<string | null>(null);

  const [editingHours, setEditingHours] = useState(false);
  const [draftHours, setDraftHours] = useState<OperatingHours | null>(null);
  const [hoursErrors, setHoursErrors] = useState<HoursErrors>({});

  const { mutateAsync: updateSettings, isPending: isSaving } = useAdminUpdateSettings({
    mutation: {
      onSuccess: async (response) => {
        if (response.status === 200) {
          queryClient.setQueryData(getAdminGetSettingsQueryKey(), response);
        }

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
      const errors: ClinicErrors = {};
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
    setDurationError(null);
    setEditingDuration(true);
  };

  const handleSaveDuration = async () => {
    if (!(settings && hours)) return;

    const result = appointmentDurationSchema.safeParse(draftDuration);
    if (!result.success) {
      setDurationError(result.error.issues[0]?.message ?? "Choose a valid duration.");
      return;
    }

    await persistSettings(
      {
        ...toSettingsCommand(settings, hours),
        defaultAppointmentDurationMinutes: result.data,
      },
      "Appointment duration updated.",
      () => setEditingDuration(false),
    );
  };

  const handleCancelDuration = () => {
    setEditingDuration(false);
    setDurationError(null);
  };

  const handleEditHours = () => {
    if (!hours) return;

    setDraftHours(hours);
    setHoursErrors({});
    setEditingHours(true);
  };

  const handleSaveHours = async () => {
    if (!(settings && draftHours)) return;

    const errors = validateOperatingHours(draftHours);
    if (Object.keys(errors).length > 0) {
      setHoursErrors(errors);
      return;
    }

    await persistSettings(
      toSettingsCommand(settings, draftHours),
      "Operating hours updated.",
      () => {
        setEditingHours(false);
        setDraftHours(null);
        setHoursErrors({});
      },
    );
  };

  const handleCancelHours = () => {
    setEditingHours(false);
    setDraftHours(null);
    setHoursErrors({});
  };

  const updateDraftDay = (day: Day, patch: Partial<DaySchedule>) => {
    setDraftHours((prev) => {
      if (!prev) return prev;

      setHoursErrors((current) => {
        if (!current[day]) return current;

        const next = { ...current };
        delete next[day];
        return next;
      });

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
                isSaving={isSaving && editingClinic}
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
                isSaving={isSaving && editingDuration}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="flex flex-col gap-1.5">
              <SectionLabel>Appointment Duration</SectionLabel>
              {editingDuration ? (
                <>
                  <Select
                    value={draftDuration}
                    onValueChange={(v) => {
                      if (v !== null) {
                        setDraftDuration(v);
                        setDurationError(null);
                      }
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((duration) => (
                        <SelectItem key={duration} value={duration.toString()}>
                          {duration} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {durationError ? (
                    <p className="text-destructive text-xs">{durationError}</p>
                  ) : null}
                </>
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
                isSaving={isSaving && editingHours}
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
                  const error = hoursErrors[day];

                  if (!schedule) return null;

                  return (
                    <div key={day} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
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
                                  onChange={(e) =>
                                    updateDraftDay(day, { openTime: e.target.value })
                                  }
                                  aria-invalid={Boolean(error)}
                                  className="rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                                />
                                <span className="text-muted-foreground text-xs">to</span>
                                <input
                                  type="time"
                                  value={schedule.closeTime}
                                  onChange={(e) =>
                                    updateDraftDay(day, { closeTime: e.target.value })
                                  }
                                  aria-invalid={Boolean(error)}
                                  className="rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
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
                      {error ? (
                        <p className="mt-1 pl-28 text-destructive text-xs">{error}</p>
                      ) : null}
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
