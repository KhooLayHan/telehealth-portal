import { Link } from "@tanstack/react-router";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentsPagination } from "./components/AppointmentsPagination";
import { AppointmentsTable } from "./components/AppointmentsTable";
import { useAppointments } from "./components/UseAppointments";

export function PatientAppointmentsList() {
  const {
    pagedResult,
    filteredItems,
    isLoading,
    isError,
    view,
    searchTerm,
    handleViewChange,
    handleSearchChange,
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

        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={handleViewChange}>
            <TabsList className="grid w-50 grid-cols-2">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            render={
              <Link to="/appointments/book">
                <Plus className="mr-2 size-4" />
                Book New Appointment
              </Link>
            }
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Search input */}
        <div className="relative mb-4 w-72">
          <label htmlFor="appointment-search" className="sr-only">
            Search appointments by doctor name
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="appointment-search"
            placeholder="Search by doctor name…"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-9 pr-9 text-sm"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => handleSearchChange("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          )}
        </div>

        {isError ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md bg-destructive/10 p-4 text-sm text-destructive-foreground"
          >
            Failed to load appointments. Please try again.
          </div>
        ) : (
          <div className="space-y-4">
            <AppointmentsTable data={filteredItems} isLoading={isLoading} view={view} />

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
