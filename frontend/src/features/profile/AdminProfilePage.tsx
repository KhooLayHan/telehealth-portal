import { motion, type Variants } from "framer-motion";
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Shield,
  User,
  X,
} from "lucide-react";
import type * as React from "react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type AdminPasswordFormData,
  type AdminProfileFormData,
  UseAdminProfile,
} from "./UseAdminProfile";

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
  type = "text",
  onChange,
}: {
  label: string;
  field: keyof AdminProfileFormData;
  value: string;
  error?: string;
  placeholder?: string;
  type?: string;
  onChange: (field: keyof AdminProfileFormData, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        placeholder={placeholder}
        className={error ? "border-destructive focus-visible:ring-destructive" : ""}
      />
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function SelectFieldRow({
  label,
  field,
  value,
  error,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  field: keyof AdminProfileFormData;
  value: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  onChange: (field: keyof AdminProfileFormData, value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <Select value={value || undefined} onValueChange={(val) => onChange(field, val)}>
        <SelectTrigger
          className={`w-full ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        >
          <SelectValue placeholder={placeholder ?? `Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function PasswordFieldRow({
  label,
  field,
  value,
  error,
  placeholder,
  onChange,
}: {
  label: string;
  field: keyof AdminPasswordFormData;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (field: keyof AdminPasswordFormData, value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-[0.15em]">
        {label}
      </span>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={`pr-9 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other / Prefer not to say" },
];

export function AdminProfilePage() {
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
    isChangingPassword,
    isSavingPassword,
    passwordData,
    passwordErrors,
    handleOpenPasswordChange,
    handleCancelPasswordChange,
    handlePasswordFieldChange,
    handleSavePassword,
  } = UseAdminProfile();

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
  const role = me.roles[0] ?? "admin";
  const initials =
    me.firstName.charAt(0).toUpperCase() + (me.lastName?.charAt(0).toUpperCase() ?? "");

  const genderLabel = GENDER_OPTIONS.find((o) => o.value === me.gender)?.label ?? null;

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
          Manage your personal information and account settings.
        </p>
      </motion.div>

      {/* Hero card */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
          <CardContent className="flex items-center gap-6 px-6 pb-6 pt-7">
            {/* Avatar */}
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
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="w-fit capitalize">
                    {role}
                  </Badge>
                  {me.username && (
                    <span className="text-muted-foreground text-xs">@{me.username}</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Mail className="size-3.5" />
                  <span>{me.email}</span>
                </div>
              </div>

              {/* Edit / Save buttons */}
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

      {/* Personal info + Contact grid */}
      <div className="grid grid-cols-2 gap-5">
        {/* Personal information */}
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
                  <div className="h-px bg-border" />
                  <FieldRow
                    label="Date of Birth"
                    field="dateOfBirth"
                    value={formData.dateOfBirth}
                    error={formErrors.dateOfBirth}
                    type="date"
                    onChange={handleFieldChange}
                  />
                  <div className="h-px bg-border" />
                  <SelectFieldRow
                    label="Gender"
                    field="gender"
                    value={formData.gender}
                    error={formErrors.gender}
                    placeholder="Select gender"
                    options={GENDER_OPTIONS}
                    onChange={handleFieldChange}
                  />
                </>
              ) : (
                <>
                  <InfoRow label="First Name" value={me.firstName} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Last Name" value={me.lastName} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Email Address" value={me.email} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Date of Birth" value={me.dateOfBirth} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Gender" value={genderLabel} />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact & Identity */}
        <motion.div variants={cardAnim}>
          <Card className="relative h-full overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
            <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-7">
              <SectionLabel>Contact & Identity</SectionLabel>

              {isEditing ? (
                <>
                  <FieldRow
                    label="Username"
                    field="username"
                    value={formData.username}
                    error={formErrors.username}
                    placeholder="e.g. alex_admin"
                    onChange={handleFieldChange}
                  />
                  <div className="h-px bg-border" />
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
                  <InfoRow label="Username" value={me.username ? `@${me.username}` : null} />
                  <div className="h-px bg-border" />
                  <InfoRow label="Phone Number" value={me.phone} />
                  <div className="h-px bg-border" />
                  <InfoRow label="IC Number" value={me.icNumber} />
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed address */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="px-6 pb-6 pt-7">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="size-3.5 text-muted-foreground" />
              <SectionLabel>Address</SectionLabel>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-4">
                <FieldRow
                  label="Address Line 1"
                  field="addressLine1"
                  value={formData.addressLine1}
                  error={formErrors.addressLine1}
                  placeholder="Unit / floor / building name"
                  onChange={handleFieldChange}
                />
                <FieldRow
                  label="Address Line 2"
                  field="addressLine2"
                  value={formData.addressLine2}
                  error={formErrors.addressLine2}
                  placeholder="Street name (optional)"
                  onChange={handleFieldChange}
                />
                <div className="grid grid-cols-3 gap-4">
                  <FieldRow
                    label="City"
                    field="city"
                    value={formData.city}
                    error={formErrors.city}
                    placeholder="City"
                    onChange={handleFieldChange}
                  />
                  <FieldRow
                    label="State"
                    field="state"
                    value={formData.state}
                    error={formErrors.state}
                    placeholder="State"
                    onChange={handleFieldChange}
                  />
                  <FieldRow
                    label="Postal Code"
                    field="postalCode"
                    value={formData.postalCode}
                    error={formErrors.postalCode}
                    placeholder="00000"
                    onChange={handleFieldChange}
                  />
                </div>
                <FieldRow
                  label="Country"
                  field="country"
                  value={formData.country}
                  error={formErrors.country}
                  placeholder="Country"
                  onChange={handleFieldChange}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Address Line 1" value={me.addressLine1} />
                  <InfoRow label="Address Line 2" value={me.addressLine2} />
                </div>
                <div className="h-px bg-border" />
                <div className="grid grid-cols-3 gap-4">
                  <InfoRow label="City" value={me.city} />
                  <InfoRow label="State" value={me.state} />
                  <InfoRow label="Postal Code" value={me.postalCode} />
                </div>
                <div className="h-px bg-border" />
                <InfoRow label="Country" value={me.country} />
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Account details */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />
          <CardContent className="flex flex-col gap-5 px-6 pb-6 pt-7">
            <div className="flex items-center gap-2">
              <Shield className="size-3.5 text-muted-foreground" />
              <SectionLabel>Account Details</SectionLabel>
            </div>

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

      {/* Change password */}
      <motion.div variants={cardAnim}>
        <Card className="relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-0.75 bg-border" />
          <CardContent className="px-6 pb-6 pt-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="size-3.5 text-muted-foreground" />
                <SectionLabel>Security</SectionLabel>
              </div>
              {!isChangingPassword && (
                <button
                  type="button"
                  onClick={handleOpenPasswordChange}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-medium text-xs transition-colors hover:bg-muted"
                >
                  <Lock className="size-3" />
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <div className="mt-4 flex flex-col gap-4">
                <PasswordFieldRow
                  label="Current Password"
                  field="currentPassword"
                  value={passwordData.currentPassword}
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                  onChange={handlePasswordFieldChange}
                />
                <PasswordFieldRow
                  label="New Password"
                  field="newPassword"
                  value={passwordData.newPassword}
                  error={passwordErrors.newPassword}
                  placeholder="Min. 8 chars, uppercase, number"
                  onChange={handlePasswordFieldChange}
                />
                <PasswordFieldRow
                  label="Confirm New Password"
                  field="confirmPassword"
                  value={passwordData.confirmPassword}
                  error={passwordErrors.confirmPassword}
                  placeholder="Repeat new password"
                  onChange={handlePasswordFieldChange}
                />
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelPasswordChange}
                    disabled={isSavingPassword}
                    className="gap-1.5"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSavePassword}
                    disabled={isSavingPassword}
                    style={{ backgroundColor: ACCENT }}
                    className="gap-1.5 text-white hover:opacity-90"
                  >
                    {isSavingPassword ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <KeyRound className="size-3.5" />
                    )}
                    Update Password
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-muted-foreground text-sm">
                Use a strong password that you don't use elsewhere.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
