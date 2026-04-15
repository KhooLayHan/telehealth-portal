import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  minDate: string;
  onChange: (date: string | null) => void;
};

export function DatePicker({ value, minDate, onChange }: DatePickerProps) {
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
      <Label htmlFor="date-picker-trigger">Select Date</Label>
      <Popover>
        <PopoverTrigger
          id="date-picker-trigger"
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {value ? format(selectedDate as Date, "PPP") : <span>Pick a date</span>}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            disabled={(date) => (minDateObj ? date < minDateObj : false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
