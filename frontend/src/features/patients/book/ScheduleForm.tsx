// src/features/appointments/book/ScheduleForm.tsx

import { useMemo, useState } from "react";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NextButton } from "./components/form/NextButton";
import { ScheduleTimeSlotField } from "./components/form/ScheduleTimeSlotField";
import { DatePicker } from "./components/ui/DatePicker";
import { DoctorSelect } from "./components/ui/DoctorSelect";
import { useDoctorsQuery } from "./hooks/useDoctorsQuery";
import { useScheduleQuery } from "./hooks/useScheduleQuery";
import type { ScheduleStepProps } from "./schema";
import { getMinDate } from "./schema";

export function ScheduleForm({ form, onNext }: ScheduleStepProps) {
  const minDate = useMemo(() => getMinDate(), []);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const { doctors, isLoading: isLoadingDoctors } = useDoctorsQuery();
  const { availableSchedules, isLoading, isError } = useScheduleQuery({
    selectedDate,
    selectedDoctorId,
  });

  const handleDoctorChange = (id: string | null) => {
    setSelectedDoctorId(id ?? "");
    form.setFieldValue("schedulePublicId", "");
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    form.setFieldValue("schedulePublicId", "");
  };

  if (!selectedDate) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl">Choose a Time</CardTitle>
          <CardDescription>
            Select your preferred doctor, date, and available time slot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doctor-select">Select Doctor</Label>
              <DoctorSelect
                doctors={doctors}
                selectedId={selectedDoctorId}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
              />
            </div>
            <DatePicker value={selectedDate} minDate={minDate} onChange={handleDateChange} />
          </div>
          <p className="text-sm text-muted-foreground italic">Please select a date first.</p>
        </CardContent>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl">Choose a Time</CardTitle>
          <CardDescription>
            Select your preferred doctor, date, and available time slot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doctor-select">Select Doctor</Label>
              <DoctorSelect
                doctors={doctors}
                selectedId={selectedDoctorId}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
              />
            </div>
            <DatePicker value={selectedDate} minDate={minDate} onChange={handleDateChange} />
          </div>
          <p className="text-sm text-muted-foreground italic">Loading available slots…</p>
        </CardContent>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl">Choose a Time</CardTitle>
          <CardDescription>
            Select your preferred doctor, date, and available time slot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doctor-select">Select Doctor</Label>
              <DoctorSelect
                doctors={doctors}
                selectedId={selectedDoctorId}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
              />
            </div>
            <DatePicker value={selectedDate} minDate={minDate} onChange={handleDateChange} />
          </div>
          <p className="text-sm text-destructive" role="alert">
            Could not load available slots. Please try again.
          </p>
        </CardContent>
      </>
    );
  }

  if (availableSchedules.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle className="text-2xl">Choose a Time</CardTitle>
          <CardDescription>
            Select your preferred doctor, date, and available time slot.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doctor-select">Select Doctor</Label>
              <DoctorSelect
                doctors={doctors}
                selectedId={selectedDoctorId}
                isLoading={isLoadingDoctors}
                onChange={handleDoctorChange}
              />
            </div>
            <DatePicker value={selectedDate} minDate={minDate} onChange={handleDateChange} />
          </div>
          <p className="text-sm text-muted-foreground italic">
            No slots available for this date. Try another day.
          </p>
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Choose a Time</CardTitle>
        <CardDescription>
          Select your preferred doctor, date, and available time slot.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="doctor-select">Select Doctor</Label>
            <DoctorSelect
              doctors={doctors}
              selectedId={selectedDoctorId}
              isLoading={isLoadingDoctors}
              onChange={handleDoctorChange}
            />
          </div>
          <DatePicker value={selectedDate} minDate={minDate} onChange={handleDateChange} />
        </div>

        <ScheduleTimeSlotField
          form={form}
          availableSchedules={availableSchedules}
          isLoading={isLoading}
          isError={isError}
        />

        <div className="flex justify-end pt-6">
          <NextButton form={form} onNext={onNext} />
        </div>
      </CardContent>
    </>
  );
}
