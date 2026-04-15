import { Calendar as CalendarIcon } from "lucide-react";
import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DatePickerProps {
  value: string;
  minDate: string;
  onChange: (date: string) => void;
}

export function DatePicker({ value, minDate, onChange }: DatePickerProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
