import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useGetAllStatuses, useUpdateById } from "@/api/generated/appointments/appointments";
import { useGetAll } from "@/api/generated/doctors/doctors";
import { useGetAllAvailable } from "@/api/generated/schedules/schedules";
import type { ReceptionistAppointmentDetailDto } from "@/api/model/ReceptionistAppointmentDetailDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ACCENT } from "./constants";
import { SectionLabel } from "./SectionLabel";
import { StaticField } from "./StaticField";

export function AppointmentEditForm({
  appointment,
  isTerminal,
}: {
  appointment: ReceptionistAppointmentDetailDto;
  isTerminal: boolean;
}) {
  const navigate = useNavigate();
  const { mutateAsync: updateAppointment, isPending } = useUpdateById();

  const [selectedDoctorId, setSelectedDoctorId] = useState(appointment.doctorPublicId ?? "");
  const [scheduleDate, setScheduleDate] = useState(String(appointment.date ?? ""));

  const { data: statusesData } = useGetAllStatuses();
  const statuses = statusesData?.status === 200 ? statusesData.data : [];

  const { data: doctorsData } = useGetAll({ Page: 1, PageSize: 50 });
  const doctors = doctorsData?.status === 200 ? doctorsData.data.items : [];

  const { data: schedulesData } = useGetAllAvailable(
    { Date: scheduleDate, DoctorPublicId: selectedDoctorId },
    { query: { enabled: !!scheduleDate && !!selectedDoctorId } },
  );
  const slots = schedulesData?.status === 200 ? schedulesData.data : [];

  const form = useForm({
    defaultValues: {
      status: appointment.statusSlug ?? "",
      cancellationReason: appointment.cancellationReason ?? "",
      doctorPublicId: appointment.doctorPublicId ?? "",
      scheduleDate: String(appointment.date ?? ""),
      schedulePublicId: appointment.schedulePublicId ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateAppointment({
          id: String(appointment.publicId),
          data: {
            statusSlug: value.status,
            schedulePublicId: value.schedulePublicId,
            cancellationReason: value.cancellationReason || null,
          },
        });
        toast.success("Appointment updated successfully.");
        navigate({ to: "/appointments", search: { today: undefined } });
      } catch {
        toast.error("Failed to update appointment. Please try again.");
      }
    },
  });

  return (
    <Card className="relative overflow-hidden h-full sm:w-180">
      <div className="absolute top-0 inset-x-0 h-0.75 bg-border" />
      <CardContent className="pt-7 pb-6 px-6">
        {isTerminal && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <span className="text-base">🔒</span>
            This appointment is <strong className="text-foreground">{appointment.status}</strong>{" "}
            and cannot be modified.
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-6"
        >
          {/* Current appointment snapshot */}
          <div>
            <SectionLabel>Current Appointment</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <StaticField label="Doctor" value={appointment.doctorName} />
              <StaticField label="Specialization" value={appointment.specialization} />
              <StaticField label="Date" value={String(appointment.date ?? "—")} />
              <StaticField
                label="Time"
                value={
                  <span className="font-mono text-sm" style={{ color: ACCENT }}>
                    {String(appointment.startTime)} – {String(appointment.endTime)}
                  </span>
                }
              />
            </div>
          </div>

          <Separator />

          {/* Reschedule */}
          <div className="flex flex-col gap-3">
            <SectionLabel>Reschedule</SectionLabel>

            {/* Doctor */}
            <form.Field name="doctorPublicId">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-xs font-semibold text-foreground/70"
                    >
                      Doctor
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(e) => {
                        field.handleChange(e ?? "");
                        setSelectedDoctorId(e ?? "");
                        form.setFieldValue("schedulePublicId", "");
                      }}
                      disabled={isTerminal}
                    >
                      <SelectTrigger className="h-9 text-sm w-full">
                        {(() => {
                          const doc = doctors.find((d) => d.doctorPublicId === field.state.value);
                          return doc ? (
                            <span>
                              {doc.firstName} {doc.lastName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Select a doctor</span>
                          );
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((d) => (
                          <SelectItem key={d.doctorPublicId} value={d.doctorPublicId}>
                            {d.firstName} {d.lastName}
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {d.specialization}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Date + Time slot */}
            <div className="flex gap-1.5">
              <form.Field name="scheduleDate">
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor="schedule-date"
                        className="text-xs font-semibold text-foreground/70"
                      >
                        Date
                      </FieldLabel>
                      <Input
                        type="date"
                        id="schedule-date"
                        className="h-9 text-sm"
                        value={field.state.value}
                        disabled={isTerminal}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                          setScheduleDate(e.target.value);
                          form.setFieldValue("schedulePublicId", "");
                        }}
                      />
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
                        />
                      )}
                    </Field>
                  );
                }}
              </form.Field>

              <form.Field
                name="schedulePublicId"
                validators={{
                  onSubmit: ({ value }) => (!value ? "Time slot is required" : undefined),
                }}
              >
                {(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel
                        htmlFor={field.name}
                        className="text-xs font-semibold text-foreground/70"
                      >
                        Time Slot
                      </FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(e) => {
                          field.handleChange(e ?? "");
                        }}
                        disabled={isTerminal || !selectedDoctorId || !scheduleDate}
                      >
                        <SelectTrigger className="h-9 text-sm w-full">
                          {(() => {
                            const slot = slots.find((s) => s.publicId === field.state.value);
                            if (slot)
                              return (
                                <span className="font-mono">
                                  {String(slot.startTime)} – {String(slot.endTime)}
                                </span>
                              );
                            if (!selectedDoctorId || !scheduleDate)
                              return (
                                <span className="text-muted-foreground">
                                  Pick a doctor &amp; date first
                                </span>
                              );
                            if (slots.length === 0)
                              return (
                                <span className="text-muted-foreground">No slots available</span>
                              );
                            return (
                              <span className="text-muted-foreground">Select a time slot</span>
                            );
                          })()}
                        </SelectTrigger>
                        <SelectContent>
                          {slots.map((slot) => (
                            <SelectItem key={slot.publicId} value={slot.publicId ?? ""}>
                              <span className="font-mono">
                                {String(slot.startTime)} – {String(slot.endTime)}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInvalid && (
                        <FieldError
                          errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
                        />
                      )}
                    </Field>
                  );
                }}
              </form.Field>
            </div>
          </div>

          <Separator />

          {/* Status */}
          <div className="flex flex-col gap-3">
            <SectionLabel>Status</SectionLabel>

            <form.Field name="status">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel
                      htmlFor={field.name}
                      className="text-xs font-semibold text-foreground/70"
                    >
                      Appointment Status
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(e) => {
                        field.handleChange(e ?? "");
                      }}
                      disabled={isTerminal}
                    >
                      <SelectTrigger className="h-9 text-sm w-full">
                        {(() => {
                          const picked = statuses.find((s) => s.slug === field.state.value);
                          return picked ? (
                            <span>{picked.name}</span>
                          ) : (
                            <span className="text-muted-foreground">Select status</span>
                          );
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s.slug} value={s.slug}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError
                        errors={field.state.meta.errors.map((e) => ({ message: String(e) }))}
                      />
                    )}
                  </Field>
                );
              }}
            </form.Field>

            {/* Cancellation reason */}
            <form.Subscribe selector={(state) => state.values.status}>
              {(status) =>
                status === "cancelled" && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      className="text-xs font-medium text-foreground/70"
                      htmlFor="cancellation-reason"
                    >
                      Cancellation Reason
                      <span className="text-destructive ml-0.5">*</span>
                    </label>
                    <form.Field
                      name="cancellationReason"
                      validators={{
                        onSubmit: ({ value }) =>
                          !value?.trim() ? "Cancellation reason is required" : undefined,
                      }}
                    >
                      {(field) => {
                        const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                        return (
                          <>
                            <Textarea
                              id="cancellation-reason"
                              className="text-sm resize-none"
                              rows={3}
                              placeholder="Reason for cancellation…"
                              value={field.state.value}
                              disabled={isTerminal}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                            />
                            {isInvalid && (
                              <FieldError
                                errors={field.state.meta.errors.map((e) => ({
                                  message: String(e),
                                }))}
                              />
                            )}
                          </>
                        );
                      }}
                    </form.Field>
                  </div>
                )
              }
            </form.Subscribe>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isPending || isTerminal}
              className="h-9 px-6 text-sm font-semibold"
              style={{ background: isTerminal ? undefined : ACCENT }}
            >
              {isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
