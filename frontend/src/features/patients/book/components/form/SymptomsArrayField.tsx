import type { BookingFormInstance, SymptomItem } from "../../schema";
import { AddSymptomButton, SymptomCard } from "../ui/SymptomCard";
import { SymptomDurationField, SymptomNameField, SymptomSeverityField } from "./SymptomFields";

type SymptomsArrayFieldProps = {
  form: BookingFormInstance;
};

export function SymptomsArrayField({ form }: SymptomsArrayFieldProps) {
  return (
    <form.Field name="symptoms">
      {(field) => (
        <>
          <AddSymptomButton
            onClick={() =>
              field.pushValue({
                _id: crypto.randomUUID(),
                name: "",
                severity: "Mild",
                duration: "",
              })
            }
          />

          <div className="space-y-3">
            {field.state.value.map((symptom: SymptomItem, i: number) => (
              <SymptomCard
                key={symptom._id}
                symptom={symptom}
                index={i}
                onRemove={() => field.removeValue(i)}
              >
                <SymptomNameField form={form} index={i} symptomId={symptom._id} />
                <SymptomSeverityField form={form} index={i} symptomId={symptom._id} />
                <SymptomDurationField form={form} index={i} symptomId={symptom._id} />
              </SymptomCard>
            ))}
          </div>
        </>
      )}
    </form.Field>
  );
}
