import { Calendar as CalendarIcon } from "lucide-react";
import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DatePickerProps = {
  value: string;
  minDate: string;
  onChange: (date: string) => void;
};

export function DatePicker({ value, minDate, onChange }: DatePickerProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const selectedDate = value ? new Date(value) : undefined;
  const minDateObj = minDate ? new Date(minDate) : undefined;
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange("");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date-input">Select Date</Label>
      <div className="relative">
        <CalendarIcon className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          id="date-input"
          type="date"
          className="pl-9"
          value={value}
          min={minDate}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}
