import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, MoreHorizontal, XCircle } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import {
  getGetAllAppointmentsQueryKey,
  useDeleteAppointmentBySlug,
  useUpdateAppointmentBySlug,
} from "@/api/generated/patients/patients";
import type { AppointmentDto } from "@/api/model/AppointmentDto";
import type { ApiError } from "@/api/ofetch-mutator";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AppointmentActions({ appointment }: { appointment: AppointmentDto }) {
  const queryClient = useQueryClient();
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const [cancelError, setCancelError] = useState<string | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // 1. Mutations
  const cancelMutation = useDeleteAppointmentBySlug();
  const rescheduleMutation = useUpdateAppointmentBySlug();

  // 2. Cancel Form Setup
  const cancelForm = useForm({
    defaultValues: { cancellationReason: "" },
    validators: {
      onChange: z.object({
        cancellationReason: z.string().min(5, "Reason must be at least 5 characters").max(500),
      }),
    },
    onSubmit: async ({ value }) => {
      setCancelError(null);
      try {
        await cancelMutation.mutateAsync({
          slug: appointment.slug, // Uses the slug from the row data!
          data: value,
        });

        // 🪄 MAGIC: Tell TanStack Query to refresh the table data instantly!
        queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
        setIsCancelOpen(false);
      } catch (err) {
        const apiError = err as ApiError;
        setCancelError(apiError.data?.detail || "Failed to cancel appointment.");
      }
    },
  });

  // 3. Reschedule Form Setup (Simplified - normally you'd fetch available slots here)
  const rescheduleForm = useForm({
    defaultValues: { newSchedulePublicId: "" },
    validators: {
      onChange: z.object({
        newSchedulePublicId: z.string().min(1, "Please select a new time slot."),
      }),
    },
    onSubmit: async ({ value }) => {
      setRescheduleError(null);
      try {
        await rescheduleMutation.mutateAsync({
          slug: appointment.slug,
          data: value,
        });

        queryClient.invalidateQueries({ queryKey: getGetAllAppointmentsQueryKey() });
        setIsRescheduleOpen(false);
      } catch (err) {
        const apiError = err as ApiError;
        setRescheduleError(apiError.data?.detail || "Failed to reschedule appointment.");
      }
    },
  });

  // Only allow actions if the appointment is currently 'Booked' (not completed/cancelled)
  const isActionable = appointment.status?.toLowerCase() === "booked";

  if (!isActionable) {
    return null; // Don't render the action menu if it's already past/cancelled
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsRescheduleOpen(true)}>
            <CalendarClock className="mr-2 size-4" />
            Reschedule
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
            onClick={() => setIsCancelOpen(true)}
          >
            <XCircle className="mr-2 size-4" />
            Cancel Appointment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 🛑 CANCEL DIALOG */}
      <Dialog
        open={isCancelOpen}
        onOpenChange={(open) => {
          setIsCancelOpen(open);
          if (!open) {
            cancelForm.reset();
            setCancelError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your appointment with{" "}
              <strong>{appointment.doctorName}</strong> on {appointment.date}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              cancelForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            {cancelError && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
                {cancelError}
              </div>
            )}

            <cancelForm.Field name="cancellationReason">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Reason for Cancellation</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g., I have a sudden schedule conflict."
                    className={field.state.meta.errors.length ? "border-destructive" : ""}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </cancelForm.Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCancelOpen(false)}>
                Close
              </Button>
              <cancelForm.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={!state.canSubmit || cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
                  </Button>
                )}
              </cancelForm.Subscribe>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 📅 RESCHEDULE DIALOG */}
      <Dialog
        open={isRescheduleOpen}
        onOpenChange={(open) => {
          setIsRescheduleOpen(open);
          if (!open) {
            rescheduleForm.reset();
            setRescheduleError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new time slot for your visit with {appointment.doctorName}.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              rescheduleForm.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            {rescheduleError && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
                {rescheduleError}
              </div>
            )}

            <rescheduleForm.Field name="newSchedulePublicId">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Available Slots</Label>
                  <select
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a new time...</option>
                    <option value="dummy-uuid-1">Tomorrow at 09:00 AM</option>
                    <option value="dummy-uuid-2">Tomorrow at 10:30 AM</option>
                    {/* In a real app, you would map over a useGetAvailableSchedules() query here! */}
                  </select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-destructive">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </rescheduleForm.Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRescheduleOpen(false)}>
                Close
              </Button>
              <rescheduleForm.Subscribe>
                {(state) => (
                  <Button type="submit" disabled={!state.canSubmit || rescheduleMutation.isPending}>
                    {rescheduleMutation.isPending ? "Updating..." : "Confirm Reschedule"}
                  </Button>
                )}
              </rescheduleForm.Subscribe>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
