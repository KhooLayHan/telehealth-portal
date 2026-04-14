import { ClipboardPlus, Clock, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoctorScheduleTable } from "./DoctorScheduleTable";
import { formatLocalTime, UseDoctorSchedule } from "./UseDoctorSchedule";

export function DoctorDashboard() {
  const { schedule, isLoading, page, setPage, search, setSearch, pageSize } = UseDoctorSchedule();

  const totalCount = Number(schedule?.totalCount ?? 0);
  const pendingCount = Number(schedule?.pendingCount ?? 0);
  const nextTime = formatLocalTime(schedule?.nextAppointmentTime ?? undefined);

  return (
    <div className="space-y-6">
      {/* Doctor Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Today's Patients
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {isLoading ? (
                <span className="inline-block h-8 w-8 animate-pulse rounded bg-muted" />
              ) : (
                totalCount
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Pending Consultations
            </CardTitle>
            <ClipboardPlus className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">
              {isLoading ? (
                <span className="inline-block h-8 w-8 animate-pulse rounded bg-muted" />
              ) : (
                pendingCount
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Next Appointment
            </CardTitle>
            <Clock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-xl">
              {isLoading ? (
                <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted" />
              ) : (
                nextTime
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Schedule Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-border border-b px-6 py-4">
          <div>
            <h2 className="font-semibold text-lg">My Schedule (Today)</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Click a patient to view medical history and add notes.
            </p>
          </div>
          <Button size="sm">
            <Stethoscope className="mr-2 size-4" /> View Full Calendar
          </Button>
        </div>
        <div className="p-6">
          <DoctorScheduleTable
            items={schedule?.items ?? []}
            totalCount={totalCount}
            page={page}
            pageSize={pageSize}
            search={search}
            isLoading={isLoading}
            onPageChange={setPage}
            onSearchChange={setSearch}
          />
        </div>
      </div>
    </div>
  );
}
