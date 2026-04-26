import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5144";

export type ReceptionistMeData = {
  publicId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  phone: string | null;
  icNumber: string;
  address: string | null;
  roles: string[];
};

export type ProfileFormData = {
  firstName: string;
  lastName: string;
  phone: string;
  icNumber: string;
};

export type ProfileFormErrors = Partial<Record<keyof ProfileFormData, string>>;

const NAME_RE = /^[a-zA-Z ]+$/;
const PHONE_RE = /^\d{10}$/;
const IC_RE = /^\d{12}$/;
function validateForm(data: ProfileFormData): ProfileFormErrors {
  const errors: ProfileFormErrors = {};

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

  if (data.phone && !PHONE_RE.test(data.phone)) {
    errors.phone = "Phone number must be exactly 10 digits.";
  }

  if (!data.icNumber.trim()) {
    errors.icNumber = "IC number is required.";
  } else if (!IC_RE.test(data.icNumber)) {
    errors.icNumber = "IC number must be exactly 12 digits.";
  }

  return errors;
}

async function fetchReceptionistProfile(): Promise<ReceptionistMeData> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/receptionist`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json() as Promise<ReceptionistMeData>;
}

async function fetchAvatarUploadUrl(
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const res = await fetch(
    `${API_BASE}/api/v1/users/me/avatar/upload-url?contentType=${encodeURIComponent(contentType)}`,
    { credentials: "include" },
  );
  if (!res.ok) throw new Error("Failed to get upload URL");
  return res.json() as Promise<{ uploadUrl: string; publicUrl: string }>;
}

async function patchAvatarUrl(avatarUrl: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/avatar`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!res.ok) throw new Error("Failed to save avatar URL");
}

async function patchProfile(data: ProfileFormData): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/users/me/receptionist`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      icNumber: data.icNumber,
    }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Failed to save profile");
  }
}

export function UseReceptionistProfile() {
  const [me, setMe] = useState<ReceptionistMeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    phone: "",
    icNumber: "",
  });
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchReceptionistProfile()
      .then((data) => {
        setMe(data);
        setFormData({
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone ?? "",
          icNumber: data.icNumber,
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsUploading(true);
    try {
      const { uploadUrl, publicUrl } = await fetchAvatarUploadUrl(file.type);

      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!s3Res.ok) throw new Error("Upload to S3 failed");

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      await patchAvatarUrl(cacheBustedUrl);

      setMe((prev) => (prev ? { ...prev, avatarUrl: cacheBustedUrl } : prev));
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleEdit() {
    if (!me) return;
    setFormData({
      firstName: me.firstName,
      lastName: me.lastName,
      phone: me.phone ?? "",
      icNumber: me.icNumber,
    });
    setFormErrors({});
    setIsEditing(true);
  }

  function handleCancel() {
    setIsEditing(false);
    setFormErrors({});
  }

  function handleFieldChange(field: keyof ProfileFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  async function handleSave() {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      await patchProfile(formData);
      setMe((prev) =>
        prev
          ? {
              ...prev,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || null,
              icNumber: formData.icNumber,
            }
          : prev,
      );
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save profile";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    me,
    isLoading,
    isUploading,
    isEditing,
    isSaving,
    formData,
    formErrors,
    fileInputRef,
    handleFileChange,
    triggerFileSelect: () => fileInputRef.current?.click(),
    handleEdit,
    handleCancel,
    handleFieldChange,
    handleSave,
  };
}
