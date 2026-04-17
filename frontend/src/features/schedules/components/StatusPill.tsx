import { ACCENT } from "../ScheduleUtils";

export function StatusPill({ label, color }: { label: string; color?: string | null }) {
  const c = color || ACCENT;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-none"
      style={{ borderColor: `${c}55`, color: c, backgroundColor: `${c}12` }}
    >
      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: c }} />
      {label}
    </span>
  );
}
