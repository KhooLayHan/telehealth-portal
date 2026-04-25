import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BiomarkersForm } from "../biomarker/BiomarkersForm";

type BiomarkersStepProps = {
  labReportSlug: string;
  onBack: () => void;
  onSuccess: () => void;
};

export function BiomarkersStep({ labReportSlug, onBack, onSuccess }: BiomarkersStepProps) {
  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl">Extract Biomarkers</CardTitle>
        <CardDescription>
          Input key metrics to make them searchable and trendable for the doctor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <BiomarkersForm labReportSlug={labReportSlug} onBack={onBack} onSuccess={onSuccess} />
      </CardContent>
    </>
  );
}
