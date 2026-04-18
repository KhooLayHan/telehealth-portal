import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REPORT_TYPES, type ReportType } from "../schema";

type ReportTypeSelectorProps = {
  value: ReportType;
  onChange: (value: ReportType) => void;
};

export function ReportTypeSelector({ value, onChange }: ReportTypeSelectorProps) {
  return (
    <Field orientation="vertical">
      <FieldLabel>Report Type</FieldLabel>
      <FieldContent>
        <Select value={value} onValueChange={(v) => onChange(v as ReportType)}>
          <SelectTrigger id="report-type-select">
            <SelectValue placeholder="Select report type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldContent>
    </Field>
  );
}
