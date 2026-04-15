import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "./components/form/SubmitButton";
import { SymptomsArrayField } from "./components/form/SymptomsArrayField";
import { VisitReasonField } from "./components/form/VisitReasonField";
import type { MedicalDetailsStepProps } from "./schema";

export function MedicalDetailsForm({
  form,
  onBack,
  bookingError,
  isPending,
}: MedicalDetailsStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Medical Details</CardTitle>
        <CardDescription>
          Please describe your reason for visiting to help the doctor prepare.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <VisitReasonField form={form} />

        <SymptomsArrayField form={form} />

        {bookingError && (
          <p className="text-sm text-destructive" role="alert">
            {bookingError}
          </p>
        )}

        <div className="flex justify-between pt-6 border-t border-border">
          <Button type="button" variant="ghost" onClick={onBack}>
            <ChevronLeft className="mr-2 size-4" /> Back
          </Button>

          <SubmitButton form={form} isPending={isPending} />
        </div>
      </CardContent>
    </>
  );
}
