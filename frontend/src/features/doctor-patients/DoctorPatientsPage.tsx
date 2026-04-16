import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Calendar, Phone, Search, Shield, User, Users, X } from "lucide-react";
import type { DoctorPatientDto } from "@/api/model/DoctorPatientDto";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatLocalDate } from "@/features/dashboard/roles/UseDoctorSchedule";
import { UseDoctorPatientsPage } from "./UseDoctorPatientsPage";

const ACCENT = "#0d9488";

const BLOOD_GROUP_COLORS: Record<string, string> = {
  "A+": "bg-red-50 text-red-700 border-red-200",
  "A-": "bg-red-50 text-red-700 border-red-200",
  "B+": "bg-blue-50 text-blue-700 border-blue-200",
  "B-": "bg-blue-50 text-blue-700 border-blue-200",
  "AB+": "bg-purple-50 text-purple-700 border-purple-200",
  "AB-": "bg-purple-50 text-purple-700 border-purple-200",
  "O+": "bg-green-50 text-green-700 border-green-200",
  "O-": "bg-green-50 text-green-700 border-green-200",
};

function PatientCard({ patient }: { patient: DoctorPatientDto }) {
  const navigate = useNavigate();
  const initials = (patient.fullName ?? "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bloodGroupClass =
    BLOOD_GROUP_COLORS[patient.bloodGroup ?? ""] ?? "bg-muted text-muted-foreground border-border";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border transition-shadow hover:shadow-md">
        <div
          className="absolute top-0 inset-x-0 h-0.5 opacity-0 transition-opacity group-hover:opacity-100"
          style={{ background: ACCENT }}
        />
        <CardContent className="p-5 space-y-4">
          {/* Top row: avatar + name + badges */}
          <div className="flex items-start gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full font-semibold text-sm text-white"
              style={{ background: ACCENT }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-base leading-tight truncate">
                {patient.fullName ?? "—"}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">
                {patient.gender ?? "—"} · {patient.age ?? "—"} yrs
              </p>
            </div>
            {patient.bloodGroup && (
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${bloodGroupClass}`}
              >
                {patient.bloodGroup}
              </span>
            )}
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="size-3 shrink-0" />
              <span className="truncate">{patient.phone ?? "No phone on file"}</span>
            </div>
            {patient.emergencyContact && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Shield className="size-3 shrink-0" />
                <span className="truncate">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) ·{" "}
                  {patient.emergencyContact.phone}
                </span>
              </div>
            )}
          </div>

          {/* Allergies */}
          {(patient.allergies?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1">
              {patient.allergies!.slice(0, 3).map((a) => (
                <span
                  key={a.allergen}
                  className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                >
                  <AlertCircle className="size-2.5" />
                  {a.allergen}
                </span>
              ))}
              {(patient.allergies?.length ?? 0) > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  +{(patient.allergies?.length ?? 0) - 3} more
                </span>
              )}
            </div>
          )}

          <Separator />

          {/* Stats + action */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                {patient.totalAppointments ?? 0} visits
              </span>
              {patient.lastVisitDate && (
                <span className="text-muted-foreground/70">
                  Last: {formatLocalDate(String(patient.lastVisitDate))}
                </span>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-[#0d9488] text-white hover:bg-[#0b857a]"
              onClick={() =>
                navigate({
                  to: "/patients/$id",
                  params: { id: patient.patientPublicId ?? "" },
                })
              }
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <Card className="border-border">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="size-11 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-muted animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function DoctorPatientsPage() {
  const {
    items,
    totalCount,
    totalPages,
    page,
    search,
    isLoading,
    isError,
    setPage,
    handleSearchChange,
  } = UseDoctorPatientsPage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
            style={{ color: ACCENT }}
          >
            Patients
          </p>
          <h1 className="text-2xl font-semibold tracking-tight leading-none">Patient List</h1>
          <p className="text-muted-foreground text-sm mt-1">
            All patients you have seen or are currently treating.
          </p>
        </div>
        {!isLoading && !isError && (
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-mono">
              {totalCount} {totalCount === 1 ? "patient" : "patients"}
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search by patient name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-8 h-9 text-sm"
        />
        {search && (
          <button
            type="button"
            onClick={() => handleSearchChange("")}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      {isError ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <User className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-destructive">Failed to load patients.</p>
        </div>
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => `sk-${i}`).map((k) => (
            <SkeletonCard key={k} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <Users className="size-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {search ? "No patients match your search." : "No patients found."}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((patient) => (
              <PatientCard key={patient.patientPublicId} patient={patient} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <span>
            Page {page} of {totalPages} · {totalCount} total
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
