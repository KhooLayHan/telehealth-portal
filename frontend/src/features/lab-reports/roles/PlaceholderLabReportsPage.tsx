import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderLabReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-semibold text-2xl">Lab Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">View and manage lab reports</p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Clock className="size-6 text-primary" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Lab report listing functionality is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground text-sm pb-6">
          <p>
            This feature will allow you to view, search, and filter lab reports. Check back for
            updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
