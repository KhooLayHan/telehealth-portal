import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  changePassword,
  getAvatarUploadUrl,
  getGetMeQueryKey,
  updateAvatar,
  updateProfile,
  useGetMe,
} from "@/api/generated/users/users";
import type { UpdateProfileCommand } from "@/api/model/UpdateProfileCommand";
import { ApiError } from "@/api/ofetch-mutator";
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
  gender: "male" | "female" | "N" | null;
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

// Describes the extended profile payload accepted by the shared profile update endpoint.
type AdminUpdateProfilePayload = UpdateProfileCommand & {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  country: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  postalCode: string | null;
  state: string | null;
  username: string;
};

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const NAME_RE = /^[a-zA-Z ]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;
const PHONE_RE = /^\d{10}$/;
const IC_RE = /^\d{12}$/;
const ADDRESS_BANNED_RE = /[%$#@!&*^<>{}|[\]\\]/;
const VALID_GENDERS = new Set(["male", "female", "other", "M", "F", "O", "N"]);
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function validateProfile(data: AdminProfileFormData): AdminProfileFormErrors {
  const errors: AdminProfileFormErrors = {};
  const firstName = data.firstName.trim();
  const lastName = data.lastName.trim();
  const username = data.username.trim();
  const phone = data.phone.trim();
  const icNumber = data.icNumber.trim();
  const addressLine1 = data.addressLine1.trim();
  const addressLine2 = data.addressLine2.trim();
  const city = data.city.trim();
  const state = data.state.trim();
  const postalCode = data.postalCode.trim();
  const country = data.country.trim();

  if (!firstName) {
    errors.firstName = "First name is required.";
  } else if (firstName.length > 20) {
    errors.firstName = "First name must be 20 characters or less.";
  } else if (!NAME_RE.test(firstName)) {
    errors.firstName = "First name may only contain letters and spaces.";
  }

  if (!lastName) {
    errors.lastName = "Last name is required.";
  } else if (lastName.length > 20) {
    errors.lastName = "Last name must be 20 characters or less.";
  } else if (!NAME_RE.test(lastName)) {
    errors.lastName = "Last name may only contain letters and spaces.";
  }

  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 3 || username.length > 50) {
    errors.username = "Username must be 3-50 characters.";
  } else if (!USERNAME_RE.test(username)) {
    errors.username = "Username may only contain letters, numbers, and underscores.";
  }

  if (phone && !PHONE_RE.test(phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!icNumber) {
    errors.icNumber = "IC number is required.";
  } else if (!IC_RE.test(icNumber)) {
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

  if (data.gender && !VALID_GENDERS.has(data.gender)) {
    errors.gender = "Gender must be male, female, or other.";
  }

  if (addressLine1.length > 200) {
    errors.addressLine1 = "Address must be 200 characters or less.";
  } else if (addressLine1 && ADDRESS_BANNED_RE.test(addressLine1)) {
    errors.addressLine1 =
      "Address may not contain special characters like % $ # @ ! & * ^ < > { } | \\ [ ].";
  }

  if (addressLine2.length > 200) {
    errors.addressLine2 = "Address line 2 must be 200 characters or less.";
  } else if (addressLine2 && ADDRESS_BANNED_RE.test(addressLine2)) {
    errors.addressLine2 =
      "Address may not contain special characters like % $ # @ ! & * ^ < > { } | \\ [ ].";
  }

  if (city.length > 100) {
    errors.city = "City must be 100 characters or less.";
  } else if (city && !NAME_RE.test(city)) {
    errors.city = "City may only contain letters and spaces.";
  }

  if (state.length > 100) {
    errors.state = "State must be 100 characters or less.";
  } else if (state && !NAME_RE.test(state)) {
    errors.state = "State may only contain letters and spaces.";
  }

  if (postalCode.length > 20) {
    errors.postalCode = "Postal code must be 20 characters or less.";
  }

  if (country.length > 100) {
    errors.country = "Country must be 100 characters or less.";
  } else if (country && !NAME_RE.test(country)) {
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
  } else if (!/[^a-zA-Z0-9]/.test(data.newPassword)) {
    errors.newPassword = "Password must contain at least one special character.";
  } else if (data.currentPassword === data.newPassword) {
    errors.newPassword = "New password must be different from the current password.";
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
    country: data.country ?? "Malaysia",
  };
}

// Converts the legacy backend gender label into the current profile form value.
function normalizeGender(gender: string | null): AdminMeData["gender"] {
  return gender === "other" ? "N" : (gender as AdminMeData["gender"]);
}

// Converts the editable admin form into the shared profile update API payload.
function toUpdatePayload(data: AdminProfileFormData): AdminUpdateProfilePayload {
  const addressLine1 = emptyToNull(data.addressLine1);
  const addressLine2 = emptyToNull(data.addressLine2);

  return {
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    username: data.username.trim(),
    phone: emptyToNull(data.phone),
    icNumber: data.icNumber.trim(),
    address: addressLine1,
    dateOfBirth: emptyToNull(data.dateOfBirth),
    gender: emptyToNull(data.gender),
    addressLine1,
    addressLine2,
    city: emptyToNull(data.city),
    state: emptyToNull(data.state),
    postalCode: emptyToNull(data.postalCode),
    country: emptyToNull(data.country),
  };
}

// Normalizes empty input strings to null for nullable API fields.
function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

// Picks the safest message from an API failure without exposing request data.
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.data.detail ?? error.data.title ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
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
  country: "Malaysia",
};

export function UseAdminProfile() {
  const queryClient = useQueryClient();
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const authUser = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
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

    const profileData = {
      ...profileQuery.data,
      gender: normalizeGender(profileQuery.data.gender),
    };

    setMe(profileData);
    if (!isEditing) {
      setFormData(toFormData(profileData));
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

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      toast.error("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Profile photo must be 5 MB or smaller.");
      return;
    }

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
      await updateAvatar({ avatarUrl: publicUrl });

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
    try {
      const payload = toUpdatePayload(formData);
      await updateProfile(payload);

      setMe((prev) =>
        prev
          ? {
              ...prev,
              firstName: payload.firstName,
              lastName: payload.lastName,
              username: payload.username,
              phone: payload.phone,
              icNumber: payload.icNumber,
              dateOfBirth: payload.dateOfBirth,
              gender: (payload.gender as AdminMeData["gender"]) ?? null,
              addressLine1: payload.addressLine1,
              addressLine2: payload.addressLine2,
              city: payload.city,
              state: payload.state,
              postalCode: payload.postalCode,
              country: payload.country,
            }
          : prev,
      );

      if (authUser) {
        setAuth({ ...authUser, firstName: payload.firstName });
      }

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setIsEditing(false);
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to save profile."));
    } finally {
      setIsSaving(false);
    }
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
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordErrors({});
      setIsChangingPassword(false);
      toast.success("Password changed successfully.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setPasswordErrors({ currentPassword: "Current password is incorrect." });
        toast.error("Current password is incorrect.");
        return;
      }

      toast.error(getErrorMessage(error, "Failed to change password."));
    } finally {
      setIsSavingPassword(false);
    }
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
