import { Label } from "@/components/ui/label";
import { BLOOD_GROUP_OPTIONS, type BloodGroupSelectProps } from "../types";

export function BloodGroupSelect({ field, id }: BloodGroupSelectProps) {
  return (
    <div className="space-y-1.5 md:w-1/3">
      <Label htmlFor={id}>Blood Group</Label>
      <select
        id={id}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">Select...</option>
        {BLOOD_GROUP_OPTIONS.map((bg) => (
          <option key={bg} value={bg}>
            {bg}
          </option>
        ))}
      </select>
      {field.state.meta.errors.length > 0 && (
        <p className="text-xs text-destructive">{field.state.meta.errors[0]?.message}</p>
      )}
    </div>
  );
}
