import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useGetDailySchedulesForReceptionist } from "@/api/generated/schedules/schedules";
import type { ReceptionistDoctorScheduleSlotDto } from "@/api/model/ReceptionistDoctorScheduleSlotDto";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatLocalDate } from "@/features/dashboard/roles/UseDoctorSchedule";
import { DoctorFilterPills } from "./components/DoctorFilterPills";
import { SearchFilterBar } from "./components/SearchFilterBar";
import { SlotRow } from "./components/SlotRow";
import { StatCards } from "./components/StatCards";
import { ACCENT, addDays, BANDS, getTodayStr, timeBand } from "./ScheduleUtils";

export function DoctorSchedulesPage() {
  const [date, setDate] = useState(getTodayStr());
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "available" | "booked">("all");

  const isToday = date === getTodayStr();

  const { data, isLoading, isError } = useGetDailySchedulesForReceptionist({ Date: date });
  const allSlots = useMemo<ReceptionistDoctorScheduleSlotDto[]>(
    () => (data?.status === 200 ? data.data : []),
    [data],
  );

  // Build doctor map for filter pills
  const doctors = useMemo(() => {
    const seen = new Map<
      string,
      { name: string; specialization: string; total: number; booked: number }
    >();
    for (const s of allSlots) {
      const id = s.doctorPublicId ?? "unknown";
      if (!seen.has(id)) {
        seen.set(id, {
          name: s.doctorName ?? "",
          specialization: s.doctorSpecialization ?? "",
          total: 0,
          booked: 0,
        });
      }
      const entry = seen.get(id);
      if (!entry) continue;
      entry.total++;
      if (s.patientName) entry.booked++;
    }
    return seen;
  }, [allSlots]);

  // Apply filters
  const filtered = useMemo(() => {
    let result = allSlots;
    if (selectedDoctor) result = result.filter((s) => s.doctorPublicId === selectedDoctor);
    if (statusFilter === "available") result = result.filter((s) => !s.patientName);
    if (statusFilter === "booked") result = result.filter((s) => !!s.patientName);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.doctorName?.toLowerCase().includes(q) ||
          s.patientName?.toLowerCase().includes(q) ||
          s.visitReason?.toLowerCase().includes(q) ||
          s.doctorSpecialization?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allSlots, selectedDoctor, statusFilter, search]);

  // Group by time band
  const grouped = useMemo(() => {
    const map: Record<string, ReceptionistDoctorScheduleSlotDto[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const s of filtered) map[timeBand(String(s.startTime))].push(s);
    return map;
  }, [filtered]);

  const totalSlots = allSlots.length;
  const bookedCount = allSlots.filter((s) => !!s.patientName).length;
  const availableCount = totalSlots - bookedCount;
  const hasFilters = !!selectedDoctor || statusFilter !== "all" || !!search.trim();

  return (
    <>
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/dashboard" />}>Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Doctor Schedules</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        {/* ── Header ── */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
              style={{ color: ACCENT }}
            >
              Doctor Schedules
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isToday ? "Today" : formatLocalDate(date)}
            </h1>
            {!isLoading && !isError && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalSlots} slot{totalSlots !== 1 ? "s" : ""} ·{" "}
                <span style={{ color: ACCENT }}>{bookedCount} booked</span> ·{" "}
                <span className="text-green-600 dark:text-green-400">
                  {availableCount} available
                </span>
              </p>
            )}
          </div>

          {/* Date navigator */}
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="size-8"
              onClick={() => setDate((d) => addDays(d, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
              <Calendar className="size-3.5 text-muted-foreground" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-sm font-mono text-foreground focus:outline-none"
              />
            </div>
            <Button
              size="icon"
              variant="outline"
              className="size-8"
              onClick={() => setDate((d) => addDays(d, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
            {!isToday && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8"
                onClick={() => setDate(getTodayStr())}
              >
                Today
              </Button>
            )}
          </div>
        </div>

        {/* ── Stat cards ── */}
        {!isLoading && !isError && totalSlots > 0 && (
          <StatCards
            totalSlots={totalSlots}
            bookedCount={bookedCount}
            availableCount={availableCount}
          />
        )}

        {/* ── Doctor filter pills ── */}
        {!isLoading && !isError && doctors.size > 0 && (
          <DoctorFilterPills
            doctors={doctors}
            totalSlots={totalSlots}
            selectedDoctor={selectedDoctor}
            onSelect={setSelectedDoctor}
          />
        )}

        {/* ── Search + status filter ── */}
        {!isLoading && !isError && totalSlots > 0 && (
          <SearchFilterBar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            hasFilters={hasFilters}
            onClear={() => {
              setSelectedDoctor(null);
              setStatusFilter("all");
              setSearch("");
            }}
            filteredCount={filtered.length}
            totalCount={totalSlots}
          />
        )}

        {/* ── Slot list ── */}
        {isError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-sm text-destructive">Failed to load schedules.</p>
          </div>
        ) : isLoading ? (
          <ScheduleSkeleton />
        ) : totalSlots === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Calendar className="size-10 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No schedule slots for this date.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2">
            <Search className="size-8 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No slots match the current filters.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <AnimatePresence initial={false}>
              {BANDS.map(({ key, label, range }) => {
                const bandSlots = grouped[key];
                if (bandSlots.length === 0) return null;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1.5"
                  >
                    {/* Band header */}
                    <div className="flex items-center gap-3 px-1 mb-2">
                      <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-muted-foreground/50">
                        {label}
                      </p>
                      <span className="text-[10px] text-muted-foreground/40">{range}</span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground/40 tabular-nums">
                        {bandSlots.length} slot{bandSlots.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Rows */}
                    <div className="relative space-y-1 pl-1">
                      {bandSlots.map((slot, i) => (
                        <SlotRow key={slot.publicId} slot={slot} isToday={isToday} index={i} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-24 h-8 rounded bg-muted animate-pulse" />
            <div className="w-px h-6 bg-border" />
            <div className="w-40 h-6 rounded bg-muted animate-pulse" />
            <div className="w-px h-6 bg-border" />
            <div className="flex-1 h-4 rounded bg-muted animate-pulse" />
            <div className="w-16 h-5 rounded-full bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
