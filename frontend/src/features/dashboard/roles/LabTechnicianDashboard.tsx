import { AlertCircle, CheckCircle, FileUp, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LabTechDashboard() {
  return (
    <div className="space-y-6">
      {/* Lab Tech Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Pending Lab Requests
            </CardTitle>
            <AlertCircle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">7</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Processed Today
            </CardTitle>
            <CheckCircle className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-2xl">18</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="font-medium text-muted-foreground text-sm">
              Equipment Status
            </CardTitle>
            <Microscope className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-bold text-xl text-green-600">Online</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Orders Table */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-border border-b px-6 py-4">
            <h2 className="font-semibold text-lg">Pending Lab Orders</h2>
            <p className="mt-0.5 text-muted-foreground text-xs">
              Select a patient order to upload results.
            </p>
          </div>
          <div className="p-6">
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed border-border bg-muted/50">
              <p className="text-muted-foreground text-sm">
                Insert TanStack Table for LabOrders here
              </p>
            </div>
          </div>
        </div>

        {/* The AWS S3 Upload Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="font-semibold text-lg">Upload Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <FileUp className="mb-2 size-8 text-muted-foreground" />
              <p className="font-medium text-sm">Drag & Drop PDF here</p>
              <p className="mb-4 text-muted-foreground text-xs">Max size: 10MB</p>
              <Button size="sm" variant="secondary">
                Browse Files
              </Button>
            </div>
            <p className="text-center text-muted-foreground text-xs">
              * This will fetch a Pre-Signed URL and upload directly to AWS S3.
            </p>
            <Button className="w-full">Submit Results</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
