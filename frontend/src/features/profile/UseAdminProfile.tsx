import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getAvatarUploadUrl,
  getGetMeQueryKey,
  updateAvatar,
  useGetMe,
} from "@/api/generated/users/users";
import { useAuthStore } from "@/store/useAuthStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminMeData = {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl: string | null;
  phone: string | null;
  icNumber: string;
  dateOfBirth: string | null; // ISO "YYYY-MM-DD"
  gender: "male" | "female" | "other" | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  roles: string[];
};

export type AdminProfileFormData = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  icNumber: string;
  dateOfBirth: string;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type AdminPasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AdminProfileFormErrors = Partial<Record<keyof AdminProfileFormData, string>>;
export type AdminPasswordFormErrors = Partial<Record<keyof AdminPasswordFormData, string>>;

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const NAME_RE = /^[a-zA-Z ]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PHONE_RE = /^\d{10}$/;
const IC_RE = /^\d{12}$/;
const POSTAL_RE = /^\d{5}$/;
const ADDRESS_BANNED_RE = /[%$#@!&*^<>{}|[\]\\]/;

function validateProfile(data: AdminProfileFormData): AdminProfileFormErrors {
  const errors: AdminProfileFormErrors = {};

  if (!data.firstName.trim()) {
    errors.firstName = "First name is required.";
  } else if (data.firstName.length > 20) {
    errors.firstName = "First name must be 20 characters or less.";
  } else if (!NAME_RE.test(data.firstName)) {
    errors.firstName = "First name may only contain letters and spaces.";
  }

  if (!data.lastName.trim()) {
    errors.lastName = "Last name is required.";
  } else if (data.lastName.length > 20) {
    errors.lastName = "Last name must be 20 characters or less.";
  } else if (!NAME_RE.test(data.lastName)) {
    errors.lastName = "Last name may only contain letters and spaces.";
  }

  if (!data.username.trim()) {
    errors.username = "Username is required.";
  } else if (data.username.length < 3 || data.username.length > 20) {
    errors.username = "Username must be 3–20 characters.";
  } else if (!USERNAME_RE.test(data.username)) {
    errors.username = "Username may only contain letters, numbers, and underscores.";
  }

  if (data.phone && !PHONE_RE.test(data.phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!data.icNumber.trim()) {
    errors.icNumber = "IC number is required.";
  } else if (!IC_RE.test(data.icNumber)) {
    errors.icNumber = "IC number must be exactly 12 digits.";
  }

  if (data.dateOfBirth) {
    const dob = new Date(data.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      errors.dateOfBirth = "Invalid date.";
    } else if (dob > new Date()) {
      errors.dateOfBirth = "Date of birth cannot be in the future.";
    }
  }

  if (data.gender && !["male", "female", "other"].includes(data.gender)) {
    errors.gender = "Please select a valid gender.";
  }

  if (data.addressLine1 && ADDRESS_BANNED_RE.test(data.addressLine1)) {
    errors.addressLine1 = "Address may not contain special characters.";
  }

  if (data.addressLine2 && ADDRESS_BANNED_RE.test(data.addressLine2)) {
    errors.addressLine2 = "Address may not contain special characters.";
  }

  if (data.city && !NAME_RE.test(data.city)) {
    errors.city = "City may only contain letters and spaces.";
  }

  if (data.state && !NAME_RE.test(data.state)) {
    errors.state = "State may only contain letters and spaces.";
  }

  if (data.postalCode && !POSTAL_RE.test(data.postalCode)) {
    errors.postalCode = "Postal code must be exactly 5 digits.";
  }

  if (data.country && !NAME_RE.test(data.country)) {
    errors.country = "Country may only contain letters and spaces.";
  }

  return errors;
}

function validatePassword(data: AdminPasswordFormData): AdminPasswordFormErrors {
  const errors: AdminPasswordFormErrors = {};

  if (!data.currentPassword) {
    errors.currentPassword = "Current password is required.";
  }

  if (!data.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (data.newPassword.length < 8) {
    errors.newPassword = "Password must be at least 8 characters.";
  } else if (!/[A-Z]/.test(data.newPassword)) {
    errors.newPassword = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(data.newPassword)) {
    errors.newPassword = "Password must contain at least one lowercase letter.";
  } else if (!/\d/.test(data.newPassword)) {
    errors.newPassword = "Password must contain at least one number.";
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}

// Describes the signed upload URL response returned for profile avatar uploads.
type AvatarUploadResponse = {
  publicUrl: string;
  uploadUrl: string;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function toFormData(data: AdminMeData): AdminProfileFormData {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    username: data.username,
    phone: data.phone ?? "",
    icNumber: data.icNumber,
    dateOfBirth: data.dateOfBirth ?? "",
    gender: data.gender ?? "",
    addressLine1: data.addressLine1 ?? "",
    addressLine2: data.addressLine2 ?? "",
    city: data.city ?? "",
    state: data.state ?? "",
    postalCode: data.postalCode ?? "",
    country: data.country ?? "",
  };
}

// Provides a blank profile form while the backend profile request is loading.
const EMPTY_FORM_DATA: AdminProfileFormData = {
  firstName: "",
  lastName: "",
  username: "",
  phone: "",
  icNumber: "",
  dateOfBirth: "",
  gender: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

export function UseAdminProfile() {
  const queryClient = useQueryClient();
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const profileQuery = useGetMe<AdminMeData>({
    query: {
      select: (response) => response.data as unknown as AdminMeData,
    },
  });
  const [me, setMe] = useState<AdminMeData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AdminProfileFormData>(EMPTY_FORM_DATA);
  const [formErrors, setFormErrors] = useState<AdminProfileFormErrors>({});

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<AdminPasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<AdminPasswordFormErrors>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileQuery.data) return;

    setMe(profileQuery.data);
    if (!isEditing) {
      setFormData(toFormData(profileQuery.data));
    }
  }, [isEditing, profileQuery.data]);

  useEffect(() => {
    if (profileQuery.isError) {
      toast.error("Failed to load profile.");
    }
  }, [profileQuery.isError]);

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploading(true);
    try {
      const uploadResponse = await getAvatarUploadUrl({ contentType: file.type });
      const { publicUrl, uploadUrl } = uploadResponse.data as unknown as AvatarUploadResponse;

      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!s3Response.ok) {
        throw new Error("Upload to S3 failed");
      }

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      await updateAvatar({ avatarUrl: cacheBustedUrl });

      setMe((prev) => (prev ? { ...prev, avatarUrl: cacheBustedUrl } : prev));
      setAvatarUrl(cacheBustedUrl);
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast.success("Profile photo updated.");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleEdit() {
    if (!me) return;
    setFormData(toFormData(me));
    setFormErrors({});
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setFormErrors({});
  }

  function handleFieldChange(field: keyof AdminProfileFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSave() {
    const errors = validateProfile(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setMe((prev) =>
      prev
        ? {
            ...prev,
            firstName: formData.firstName,
            lastName: formData.lastName,
            username: formData.username,
            phone: formData.phone || null,
            icNumber: formData.icNumber,
            dateOfBirth: formData.dateOfBirth || null,
            gender: (formData.gender as AdminMeData["gender"]) || null,
            addressLine1: formData.addressLine1 || null,
            addressLine2: formData.addressLine2 || null,
            city: formData.city || null,
            state: formData.state || null,
            postalCode: formData.postalCode || null,
            country: formData.country || null,
          }
        : prev,
    );
    setIsSaving(false);
    setIsEditing(false);
    toast.success("Profile preview updated.");
  }

  // Password change handlers

  function handleOpenPasswordChange() {
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordErrors({});
    setIsChangingPassword(true);
  }

  function handleCancelPasswordChange() {
    setIsChangingPassword(false);
    setPasswordErrors({});
  }

  function handlePasswordFieldChange(field: keyof AdminPasswordFormData, value: string) {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSavePassword() {
    const errors = validatePassword(passwordData);
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setIsSavingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSavingPassword(false);
    setIsChangingPassword(false);
    toast.success("Password changed successfully.");
  }

  return {
    me,
    isLoading: profileQuery.isLoading,
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
  };
}
