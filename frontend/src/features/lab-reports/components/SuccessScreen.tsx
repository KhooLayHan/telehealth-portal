import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

type SuccessScreenProps = {
  reportType: string;
  onReset: () => void;
};

export function SuccessScreen({ reportType, onReset }: SuccessScreenProps) {
  return (
    <Card className="shadow-lg border-green-500/20">
      <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="rounded-full bg-green-100 p-3 text-green-600" aria-hidden="true">
          <CheckCircle2 className="size-12" />
        </div>
        <CardTitle className="text-2xl">Report Published!</CardTitle>
        <CardDescription className="max-w-sm mx-auto">
          The {reportType} report has been securely saved, and the patient has been notified via
          email.
        </CardDescription>
        <Button className="mt-4" onClick={onReset} variant="outline">
          Upload Another
        </Button>
      </CardContent>
    </Card>
  );
}
