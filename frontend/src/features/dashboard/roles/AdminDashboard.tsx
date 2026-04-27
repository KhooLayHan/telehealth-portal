import { CalendarDays, FileBarChart, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Admin Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Today's Appointments
            </CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">24</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">1,204</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Doctors</CardTitle>
            <Stethoscope className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">86</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">Staff</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">48</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">Admin Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 size-4" /> Provision New Staff (Doctor/Lab Tech)
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileBarChart className="mr-2 size-4" /> Generate Clinic Analytics (AWS Lambda)
            </Button>
          </CardContent>
        </Card>

        {/* Recent System Activity Table Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">System Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-border bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Boh Chun: Insert TanStack Table for Audit Logs here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
