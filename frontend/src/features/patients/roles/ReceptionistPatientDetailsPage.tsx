import { Link, useParams } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  CalendarDays,
  Droplets,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import type * as React from "react";
import { useReceptionistGetPatientById } from "@/api/generated/patients/patients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ACCENT = "#0d9488";

function getInitials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function allergyColors(severity: string) {
  const s = severity.toLowerCase();
  if (s === "severe" || s === "high")
    return { text: "#ef4444", bg: "#ef444410", border: "#ef444440" };
  if (s === "moderate" || s === "medium")
    return { text: "#f59e0b", bg: "#f59e0b10", border: "#f59e0b40" };
  return { text: "#22c55e", bg: "#22c55e10", border: "#22c55e40" };
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
        {icon}
        {label}
      </span>
      <span className="text-sm font-mono font-medium">{value || "—"}</span>
    </div>
  );
}

export function ReceptionistPatientDetailsPage() {
  const { id } = useParams({ from: "/_protected/patients/$id" });
  const { data, isLoading, isError } = useReceptionistGetPatientById(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-muted-foreground tracking-wide">Loading patient…</p>
      </div>
    );
  }

  if (isError || !data || data.status !== 200) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-sm text-destructive">Failed to load patient.</p>
      </div>
    );
  }

  const p = data.data;
  const fullName = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  const hasAllergies = p.allergies && p.allergies.length > 0;
  const hasEmergencyContacts = p.emergencyContacts && p.emergencyContacts.length > 0;

  return (
    <motion.div
      className="space-y-5 max-w-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Hero card */}
      <Card className="relative overflow-hidden">
        {/* Teal accent line */}
        <div className="absolute top-0 inset-x-0 h-0.75" style={{ background: ACCENT }} />
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 0% 0%, ${ACCENT}18 0%, transparent 60%)`,
          }}
        />

        <CardContent className="relative pt-7 pb-6 px-7">
          <div className="flex items-center gap-6">
            {/* Avatar initials */}
            <div
              className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white select-none shadow-sm"
              style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #0f766e 100%)` }}
            >
              {getInitials(p.firstName ?? "?", p.lastName ?? "?")}
            </div>

            {/* Name + contact row */}
            <div className="flex-1 min-w-0">
              <p
                className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-1"
                style={{ color: ACCENT }}
              >
                Patient Profile
              </p>
              <h2 className="text-2xl font-semibold tracking-tight leading-none mb-2.5">
                {fullName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-mono">
                  <Mail className="size-3" />
                  {p.patientEmail}
                </span>
                {p.phoneNumber && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="size-3" />
                    {p.phoneNumber}
                  </span>
                )}
              </div>
            </div>

            {/* View Appointments button */}
            <Link to="/appointments" search={{ today: undefined }}>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <CalendarDays className="size-3.5" />
                View Appointments
              </Button>
            </Link>

            {/* Blood group circle */}
            {p.bloodGroup && (
              <div className="shrink-0 flex flex-col items-center gap-1.5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold border-2"
                  style={{
                    borderColor: ACCENT,
                    color: ACCENT,
                    background: `${ACCENT}12`,
                  }}
                >
                  {p.bloodGroup}
                </div>
                <span className="flex items-center gap-1 text-[10px] tracking-wide uppercase text-muted-foreground/60">
                  <Droplets className="size-2.5" />
                  Blood
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Info grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-5">
        {/* Personal info */}
        <Card className="relative overflow-hidden">
          <div
            className="absolute top-0 inset-x-0 h-0.5"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, transparent)` }}
          />
          <CardContent className="pt-6 pb-6 px-6">
            <p
              className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-5"
              style={{ color: ACCENT }}
            >
              Personal Information
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <InfoItem
                icon={<User className="size-3" />}
                label="IC Number"
                value={p.icNumber ?? ""}
              />
              <InfoItem
                icon={<Calendar className="size-3" />}
                label="Date of Birth"
                value={p.dateOfBirth ? String(p.dateOfBirth) : ""}
              />
              <InfoItem
                icon={<Mail className="size-3" />}
                label="Email"
                value={p.patientEmail ?? ""}
              />
              <InfoItem
                icon={<Phone className="size-3" />}
                label="Phone"
                value={p.phoneNumber ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-border" />
          <CardContent className="pt-6 pb-6 px-6">
            <p className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-5 text-muted-foreground">
              Allergies
            </p>

            {hasAllergies ? (
              <div className="flex flex-col gap-2">
                {p.allergies?.map((a) => {
                  const c = allergyColors(a.severity);
                  return (
                    <div
                      key={`${a.allergen}-${a.severity}`}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg border text-xs"
                      style={{ borderColor: c.border, background: c.bg }}
                    >
                      <span
                        className="flex items-center gap-2 font-semibold"
                        style={{ color: c.text }}
                      >
                        <AlertCircle className="size-3.5 shrink-0" />
                        {a.allergen}
                      </span>
                      <div className="text-right">
                        <p
                          className="text-[10px] uppercase tracking-widest font-bold"
                          style={{ color: c.text }}
                        >
                          {a.severity}
                        </p>
                        <p className="text-muted-foreground">{a.reaction}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <AlertCircle className="size-3.5 shrink-0" />
                No known allergies
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Emergency contacts ────────────────────────────────── */}
      {hasEmergencyContacts && (
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-0.5 bg-amber-400/70" />
          <CardContent className="pt-6 pb-6 px-6">
            <p className="text-[10px] tracking-[0.22em] uppercase font-semibold mb-5 text-amber-500 dark:text-amber-400">
              Emergency Contacts
            </p>
            <div className="flex flex-wrap gap-4">
              {p.emergencyContacts?.map((ec) => (
                <div
                  key={`${ec.name}-${ec.relationship}`}
                  className="flex-1 min-w-50 flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="mt-0.5 shrink-0 w-9 h-9 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center">
                    <Shield className="size-4 text-amber-500" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{ec.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {ec.relationship}
                    </span>
                    <span className="mt-1.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Phone className="size-3" />
                      {ec.phone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
