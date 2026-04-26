import { motion, type Variants } from "framer-motion";
import { Camera, Loader2, Mail, Pencil, User, X } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type ProfileFormData, UseReceptionistProfile } from "./UseReceptionistProfile";

const ACCENT = "#0d9488";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardAnim: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 select-none font-semibold text-[10px] text-muted-foreground uppercase tracking-[0.22em]">
      {children}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <span className="font-medium text-sm">{value || "—"}</span>
    </div>
  );
}

function FieldRow({
  label,
  field,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  field: keyof ProfileFormData;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (field: keyof ProfileFormData, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

export function ReceptionistProfilePage() {
  const {
    me,
    isLoading,
    isUploading,
    isEditing,
    isSaving,
    formData,
    formErrors,
    fileInputRef,
    handleFileChange,
    triggerFileSelect,
    handleEdit,
    handleCancel,
    handleFieldChange,
    handleSave,
  } = UseReceptionistProfile();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) {
    return <p className="text-destructive text-sm">Failed to load profile.</p>;
  }

  const fullName = `${me.firstName} ${me.lastName}`;
  const role = me.roles[0] ?? "user";
  const initials =
    me.firstName.charAt(0).toUpperCase() + (me.lastName?.charAt(0).toUpperCase() ?? "");

  return (
    <motion.div
      className="flex max-w-3xl flex-col gap-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Page header */}
      <motion.div variants={cardAnim}>
        <p className="text-xs text-muted-foreground">Dashboard › Profile</p>
        <h1 className="mt-0.5 font-bold text-2xl tracking-tight">My Profile</h1>
        <p className="text-muted-foreground text-sm">
          Manage your personal information and profile photo.
        </p>
      </motion.div>

      {/* Hero card */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
          <CardContent className="flex items-center gap-6 px-6 pb-6 pt-7">
            {/* Avatar circle */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={isUploading}
                className="group relative flex size-20 items-center justify-center overflow-hidden rounded-full ring-2 ring-border transition-all hover:ring-[#0d9488] disabled:cursor-not-allowed"
                aria-label="Change profile photo"
              >
                {me.avatarUrl ? (
                  <img src={me.avatarUrl} alt={fullName} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary font-semibold text-2xl text-primary-foreground">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  {isUploading ? (
                    <Loader2 className="size-5 animate-spin text-white" />
                  ) : (
                    <>
                      <Camera className="size-4 text-white" />
                      <span className="font-medium text-[9px] text-white">Change</span>
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Name + role + email */}
            <div className="flex flex-1 items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-bold text-2xl leading-none tracking-tight">{fullName}</h2>
                <Badge variant="secondary" className="w-fit capitalize">
                  {role}
                </Badge>
                <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Mail className="size-3.5" />
                  <span>{me.email}</span>
                </div>
              </div>

              {/* Edit / Cancel + Save buttons */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="gap-1.5"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{ backgroundColor: ACCENT }}
                    className="gap-1.5 text-white hover:opacity-90"
                  >
                    {isSaving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    Save
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={handleEdit} className="gap-1.5">
                  <Pencil className="size-3.5" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Personal info */}
        <motion.div variants={cardAnim}>
          <Card className="relative h-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
            <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-7">
              <SectionLabel>Personal Information</SectionLabel>

              {isEditing ? (
                <>
                  <FieldRow
                    label="First Name"
                    field="firstName"
                    value={formData.firstName}
                    error={formErrors.firstName}
                    placeholder="First name"
                    onChange={handleFieldChange}
                  />
                  <div className="h-px bg-border" />
                  <FieldRow
                    label="Last Name"
                    field="lastName"
                    value={formData.lastName}
                    error={formErrors.lastName}
                    placeholder="Last name"
                    onChange={handleFieldChange}
                  />
                  <div className="h-px bg-border" />
                  <InfoRow label="Email Address" value={me.email} />
                </>
              ) : (
                <>
                  <InfoRow label="First Name" value={me.firstName} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Last Name" value={me.lastName} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Email Address" value={me.email} />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact & ID info */}
        <motion.div variants={cardAnim}>
          <Card className="relative h-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
            <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-7">
              <SectionLabel>Contact & Identity</SectionLabel>

              {isEditing ? (
                <>
                  <FieldRow
                    label="Phone Number"
                    field="phone"
                    value={formData.phone}
                    error={formErrors.phone}
                    placeholder="10-digit phone number"
                    onChange={handleFieldChange}
                  />
                  <div className="h-px bg-border" />
                  <FieldRow
                    label="IC Number"
                    field="icNumber"
                    value={formData.icNumber}
                    error={formErrors.icNumber}
                    placeholder="12-digit IC number"
                    onChange={handleFieldChange}
                  />
                </>
              ) : (
                <>
                  <InfoRow label="Phone Number" value={me.phone} />
                  <div className="h-px bg-border" />
                  <InfoRow label="IC Number" value={me.icNumber} />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Account details */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-7">
            <SectionLabel>Account Details</SectionLabel>

            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
                Role
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <User className="size-3.5 text-muted-foreground" />
                <span className="font-medium text-sm capitalize">{role}</span>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
                Profile Photo
              </span>
              <p className="text-muted-foreground text-sm">
                {me.avatarUrl ? "Photo uploaded." : "No photo uploaded yet."}
              </p>
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={isUploading}
                className="inline-flex w-fit items-center gap-1.5 rounded-md border border-[#0d9488] px-3 py-1.5 font-medium text-[#0d9488] text-xs transition-colors hover:bg-[#0d9488]/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Camera className="size-3" />
                {isUploading ? "Uploading..." : me.avatarUrl ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
