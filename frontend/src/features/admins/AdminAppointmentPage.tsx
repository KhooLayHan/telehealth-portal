import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, FileDown, Filter, LayoutGrid, List, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { AppointmentCalendar } from "@/features/admins/manageAppointments/AppointmentCalendar";
import { AppointmentTable } from "@/features/admins/manageAppointments/AppointmentTable";
import { useAdminAppointments } from "@/features/admins/manageAppointments/UseAdminAppointments";
import { useAppointmentsCsvExport } from "@/features/admins/manageAppointments/UseAppointmentsCsvExport";
import { cn } from "@/lib/utils";

// Defines the two display modes available on the admin appointment page.
type ViewMode = "calendar" | "list";

// Displays admin appointment search, export, calendar, and list views.
export function AdminAppointmentPage() {
  const today = new Date();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [listPage, setListPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);

  const {
    monthItems,
    scheduledDays,
    todayAppointments,
    isMonthLoading,
    listItems,
    listTotalPages,
    isListLoading,
    statuses,
  } = useAdminAppointments(
    currentYear,
    currentMonth,
    listPage,
    search,
    {
      status: statusFilter,
      todayOnly,
    },
    viewMode === "calendar",
    viewMode === "list",
  );
  const { exportAppointmentsCsv, isExportDisabled } = useAppointmentsCsvExport();
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(todayOnly);

  function handlePrev() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((year) => year - 1);
    } else {
      setCurrentMonth((month) => month - 1);
    }
    setSelectedDay(1);
  }

  function handleNext() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((year) => year + 1);
    } else {
      setCurrentMonth((month) => month + 1);
    }
    setSelectedDay(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">View Appointments</h1>
          <p className="text-lg text-muted-foreground">
            View all scheduled appointments in one place
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="h-9 gap-1.5 bg-background"
            disabled={isExportDisabled}
            onClick={() => void exportAppointmentsCsv()}
          >
            <FileDown className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by patient name, doctor, or visit reason..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setListPage(1);
            }}
            className="pl-9"
          />
        </div>
        {viewMode === "list" && (
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 gap-1.5 bg-background"
                  aria-label="Filter appointment list"
                >
                  <Filter className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              }
            />
            <PopoverContent align="end" className="w-80 gap-4 p-4">
              <PopoverHeader>
                <PopoverTitle>List filters</PopoverTitle>
              </PopoverHeader>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={statusFilter ? "outline" : "default"}
                    size="sm"
                    onClick={() => {
                      setStatusFilter("");
                      setListPage(1);
                    }}
                  >
                    All
                  </Button>
                  {statuses.map((status) => {
                    if (!status.slug) return null;

                    const slug = status.slug;

                    return (
                      <Button
                        key={slug}
                        type="button"
                        variant={statusFilter === slug ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setStatusFilter(statusFilter === slug ? "" : slug);
                          setListPage(1);
                        }}
                      >
                        {status.colorCode && (
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: status.colorCode }}
                          />
                        )}
                        {status.name ?? slug}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="size-4 text-muted-foreground" />
                  <Label htmlFor="admin-today-filter" className="text-sm">
                    Today only
                  </Label>
                </div>
                <Switch
                  id="admin-today-filter"
                  checked={todayOnly}
                  onCheckedChange={(checked) => {
                    setTodayOnly(checked);
                    setListPage(1);
                  }}
                />
              </div>

              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-fit gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setStatusFilter("");
                    setTodayOnly(false);
                    setListPage(1);
                  }}
                >
                  <X className="size-3.5" />
                  Clear filters
                </Button>
              )}
            </PopoverContent>
          </Popover>
        )}
        <div className="inline-flex shrink-0 overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 font-medium text-sm transition-colors",
              viewMode === "calendar"
                ? "border-foreground border-r bg-background text-foreground ring-1 ring-foreground ring-inset"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Calendar View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 font-medium text-sm transition-colors",
              viewMode === "list"
                ? "bg-background text-foreground ring-1 ring-foreground ring-inset"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <List className="size-3.5" />
            List View
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "calendar" ? (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <AppointmentCalendar
              currentYear={currentYear}
              currentMonth={currentMonth}
              selectedDay={selectedDay}
              scheduledDays={scheduledDays}
              monthItems={monthItems}
              todayAppointments={todayAppointments}
              isLoading={isMonthLoading}
              onDayChange={setSelectedDay}
              onPreviousMonth={handlePrev}
              onNextMonth={handleNext}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <AppointmentTable
              appointments={listItems}
              isLoading={isListLoading}
              page={listPage}
              totalPages={listTotalPages}
              onPrev={() => setListPage((page) => Math.max(1, page - 1))}
              onNext={() => setListPage((page) => Math.min(listTotalPages, page + 1))}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
