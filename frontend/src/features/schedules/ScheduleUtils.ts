export const ACCENT = "#0d9488";

export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
}

export function timeBand(timeStr?: string): "morning" | "afternoon" | "evening" {
  if (!timeStr) return "morning";
  const hour = Number.parseInt(timeStr.slice(0, 2), 10);
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function isSlotNow(startTime?: string, endTime?: string): boolean {
  if (!startTime || !endTime) return false;
  const now = getCurrentTimeStr();
  return now >= startTime && now < endTime;
}

export const BANDS = [
  { key: "morning", label: "Morning", range: "before 12 PM" },
  { key: "afternoon", label: "Afternoon", range: "12 – 5 PM" },
  { key: "evening", label: "Evening", range: "after 5 PM" },
] as const;

export type TimeBandKey = (typeof BANDS)[number]["key"];
