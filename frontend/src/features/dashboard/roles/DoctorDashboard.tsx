import { ClipboardPlus, Clock, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DoctorDashboard() {
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
            <p className="font-bold text-2xl">12</p>
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
            <p className="font-bold text-2xl">3</p>
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
            <p className="font-bold text-xl">10:30 AM</p>
          </CardContent>
        </Card>
      </div>

      {/* The Daily Schedule Table */}
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
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/50">
            <p className="text-muted-foreground text-sm">
              Wey Gen: Insert TanStack Table for Today's Appointments here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
