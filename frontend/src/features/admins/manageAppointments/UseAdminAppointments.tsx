import { useMemo } from "react";
import { useGetAllAppointmentsForReceptionist } from "@/api/generated/appointments/appointments";
import type { ReceptionistAppointmentDto } from "@/api/model/ReceptionistAppointmentDto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Represents a calendar day with its appointment count for the mini calendar dots
export type DayData = { day: number; count: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Converts year/month/day to ISO "YYYY-MM-DD" string for API date params
function toIsoDate(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

// Returns the number of days in the given month
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Groups a flat list of appointments by day-of-month for the mini calendar
function buildScheduledDays(items: ReceptionistAppointmentDto[]): DayData[] {
  const counts = new Map<number, number>();
  for (const appt of items) {
    if (appt.date) {
      const day = Number(appt.date.split("-")[2]);
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([day, count]) => ({ day, count }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// Provides all data needed for the admin appointment page: calendar dots, today panel, and list view
export function useAdminAppointments(year: number, month: number, listPage: number, search = "") {
  const today = new Date();
  const todayIso = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const firstOfMonth = toIsoDate(year, month, 1);
  const lastOfMonth = toIsoDate(year, month, daysInMonth(year, month));

  // Fetch all appointments in the visible month for calendar dots and today panel
  const monthQuery = useGetAllAppointmentsForReceptionist({
    From: firstOfMonth,
    To: lastOfMonth,
    PageSize: 50,
    SortOrder: "asc",
  });

  const monthItems = useMemo<ReceptionistAppointmentDto[]>(() => {
    if (monthQuery.data?.status === 200) return monthQuery.data.data.items;
    return [];
  }, [monthQuery.data]);

  // Per-day counts derived from month data, used to render calendar dots
  const scheduledDays = useMemo(() => buildScheduledDays(monthItems), [monthItems]);

  // Today's appointments filtered from the month data for the upcoming panel
  const todayAppointments = useMemo(
    () => monthItems.filter((a) => a.date === todayIso),
    [monthItems, todayIso],
  );

  // Paginated query for the list view tab (separate from the month overview)
  const listQuery = useGetAllAppointmentsForReceptionist({
    PageSize: 5,
    Page: listPage,
    SortOrder: "asc",
    ...(search.trim() ? { Search: search.trim() } : {}),
  });

  const listItems = useMemo<ReceptionistAppointmentDto[]>(() => {
    if (listQuery.data?.status === 200) return listQuery.data.data.items;
    return [];
  }, [listQuery.data]);

  const listTotalPages = useMemo(() => {
    if (listQuery.data?.status === 200) return Number(listQuery.data.data.totalPages ?? 1);
    return 1;
  }, [listQuery.data]);

  return {
    monthItems,
    scheduledDays,
    todayAppointments,
    isMonthLoading: monthQuery.isLoading,
    isMonthError: monthQuery.isError,
    listItems,
    listTotalPages,
    isListLoading: listQuery.isLoading,
    isListError: listQuery.isError,
  };
}
