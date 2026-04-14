import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppointments } from "../UseAppointments";
import { AppointmentsPagination } from "./AppointmentsPagination";
import { AppointmentsTable } from "./AppointmentsTable";

export function PatientAppointmentsList() {
  const {
    pagedResult,
    isLoading,
    isError,
    view,
    handleViewChange,
    handlePreviousPage,
    handleNextPage,
  } = useAppointments();

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">My Appointments</CardTitle>
          <CardDescription>View and manage your clinical visits.</CardDescription>
        </div>

        <Tabs value={view} onValueChange={handleViewChange} className="w-50">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        {isError ? (
          <div
            role="alert"
            aria-live="polite"
            className="p-4 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
          >
            Failed to load appointments. Please try again.
          </div>
        ) : (
          <div className="space-y-4">
            <AppointmentsTable data={pagedResult?.items ?? []} isLoading={isLoading} view={view} />

            {pagedResult && (
              <AppointmentsPagination
                currentPage={pagedResult.page}
                totalPages={pagedResult.totalPages}
                hasPreviousPage={pagedResult.hasPreviousPage}
                hasNextPage={pagedResult.hasNextPage}
                isLoading={isLoading}
                onPreviousPage={handlePreviousPage}
                onNextPage={handleNextPage}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
