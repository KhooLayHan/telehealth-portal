import type { DoctorListDto } from "@/api/model/DoctorListDto";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DoctorSelectProps = {
  doctors: DoctorListDto[];
  selectedId: string;
  isLoading: boolean;
  onChange: (id: string | null) => void;
};

export function DoctorSelect({ doctors, selectedId, isLoading, onChange }: DoctorSelectProps) {
  return (
    <Select value={selectedId} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger id="doctor-select" className="w-full">
        <SelectValue placeholder={isLoading ? "Loading…" : "Any Available Doctor"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">Any Available Doctor</SelectItem>
        {doctors.map((doctor) => {
          const id = doctor.doctorPublicId ?? "";
          const firstName = doctor.firstName ?? "";
          const lastName = doctor.lastName ?? "";
          const spec = doctor.specialization ?? "";

          return (
            <SelectItem key={id || `doc-${Math.random()}`} value={id}>
              {id ? `Dr. ${firstName} ${lastName} — ${spec}` : "Unknown Doctor"}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
