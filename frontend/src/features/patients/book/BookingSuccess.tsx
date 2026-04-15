import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

export function BookingSuccess() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="rounded-full bg-green-100 p-3 text-green-600">
            <CheckCircle2 className="size-12" />
          </div>
          <CardTitle className="text-2xl">Booking Confirmed!</CardTitle>
          <CardDescription className="max-w-xs mx-auto">
            Your appointment has been successfully booked. We've sent a confirmation email to your
            inbox.
          </CardDescription>
          <Button className="mt-4" onClick={() => navigate({ to: "/dashboard" })}>
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
