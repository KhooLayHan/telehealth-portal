import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value: string;
  minDate: string;
  onChange: (date: string) => void;
};

export function DatePicker({ value, minDate, onChange }: DatePickerProps) {
  const triggerId = useId();

  const parseDateOnly = (input: string): Date | undefined => {
    if (!input) {
      return undefined;
    }
    const parsed = parse(input, "yyyy-MM-dd", new Date());
    return isValid(parsed) ? parsed : undefined;
  };

  const selectedDate = parseDateOnly(value);
  const minDateObj = parseDateOnly(minDate);

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
      <Label htmlFor={triggerId}>Select Date</Label>
      <Popover>
        <PopoverTrigger
          id={triggerId}
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
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
