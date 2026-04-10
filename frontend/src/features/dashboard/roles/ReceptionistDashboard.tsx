import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      {/* Receptionist Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Today's Check-ins
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">24</p>
          </CardContent>
        </Card>
      </div>

      {/* The Daily Queue Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-border border-b px-6 py-4">
          <div>
            <h2 className="font-semibold">Live Clinic Queue</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Manage patient check-ins and statuses
            </p>
          </div>
        </div>
        <div className="p-6">
          {/* TODO: Your teammate will put their TanStack Table component here! */}
          <p className="text-muted-foreground text-sm">Data table goes here...</p>
        </div>
      </div>
    </div>
  );
}
