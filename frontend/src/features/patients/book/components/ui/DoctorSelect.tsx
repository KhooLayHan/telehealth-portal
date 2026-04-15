import type { ChangeEvent } from "react";
import type { DoctorListDto } from "@/api/model/DoctorListDto";

interface DoctorSelectProps {
  doctors: DoctorListDto[];
  selectedId: string;
  isLoading: boolean;
  onChange: (id: string) => void;
}

export function DoctorSelect({ doctors, selectedId, isLoading, onChange }: DoctorSelectProps) {
  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <select
      id="doctor-select"
      className="h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 shadow-sm"
      value={selectedId}
      disabled={isLoading}
      onChange={handleChange}
    >
      <option value="">{isLoading ? "Loading…" : "Any Available Doctor"}</option>
      {doctors.map((doctor) => (
        <option key={doctor.publicId} value={doctor.publicId}>
          Dr. {doctor.firstName} {doctor.lastName} — {doctor.specialization}
        </option>
      ))}
    </select>
  );
}
