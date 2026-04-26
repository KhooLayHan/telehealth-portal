import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminCreateReceptionist,
  useAdminDeactivateReceptionist,
  useAdminGetAllReceptionists,
  useAdminUpdateReceptionist,
} from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
import { ApiError } from "@/api/ofetch-mutator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ReceptionistTable } from "@/features/admins/manageReceptionists/ReceptionistTable";

const ACCENT = "#0d9488";
const PAGE_SIZE = 10;

// Maps gender code to a readable label
function genderLabel(code: string): string {
  const map: Record<string, string> = { M: "Male", F: "Female", O: "Other", N: "Not specified" };
  return map[code] ?? code;
}

// Formats a date string as "15 Apr 1982"
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface DetailRowProps {
  label: string;
  value: string;
}

// A single labelled row inside the detail dialog
function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

// Zod schema for validating the add receptionist form
const addReceptionistSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Must be a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    icNumber: z
      .string()
      .min(1, "IC number is required")
      .max(12, "IC number must be at most 12 characters"),
    phoneNumber: z.string(),
    gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
    dateOfBirth: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Zod schema for validating the receptionist edit form
const editReceptionistSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Must be a valid email"),
  phoneNumber: z.string(),
  gender: z.enum(["M", "F", "O", "N"], { message: "Select a gender" }),
  dateOfBirth: z.string(),
  street: z.string(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string(),
});

// Reusable labeled field wrapper used in the edit form
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface AddReceptionistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog for registering a new receptionist account
function AddReceptionistDialog({ open, onOpenChange }: AddReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminCreateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist created successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to create receptionist");
        }
      },
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      icNumber: "",
      phoneNumber: "",
      gender: "N" as "M" | "F" | "O" | "N",
      dateOfBirth: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
    validators: { onSubmit: addReceptionistSchema },
    onSubmit: async ({ value }) => {
      mutate({
        data: {
          firstName: value.firstName,
          lastName: value.lastName,
          username: value.username,
          email: value.email,
          password: value.password,
          phoneNumber: value.phoneNumber || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          icNumber: value.icNumber,
          address: value.street
            ? {
                street: value.street,
                city: value.city,
                state: value.state,
                postalCode: value.postalCode,
                country: value.country,
              }
            : null,
        },
      });
    },
  });

  // Reset form when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Add New Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the details below to register a new receptionist account.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-2">
            {/* Account credentials section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Account Credentials
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="username">
                {(field) => (
                  <FormField
                    label="Username *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="username"
                      autoComplete="off"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <FormField
                    label="Email *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="email@example.com"
                      autoComplete="off"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <FormField
                    label="Password *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <FormField
                    label="Confirm Password *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>

            {/* Personal information section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Personal Information
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="firstName">
                {(field) => (
                  <FormField
                    label="First Name *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="First name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <FormField
                    label="Last Name *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Last name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="icNumber">
                {(field) => (
                  <FormField
                    label="IC Number *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 900101011234"
                      maxLength={12}
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="phoneNumber">
                {(field) => (
                  <FormField
                    label="Phone Number"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="+60 12-345 6789"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <FormField
                    label="Gender *"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange((v ?? "N") as "M" | "F" | "O" | "N")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                        <SelectItem value="N">Not specified</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>

              <form.Field name="dateOfBirth">
                {(field) => (
                  <FormField
                    label="Date of Birth"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </FormField>
                )}
              </form.Field>
            </div>

            {/* Address section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Address
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <form.Field name="street">
                  {(field) => (
                    <FormField
                      label="Street"
                      error={
                        field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                      }
                    >
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="123 Main St"
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>

              <form.Field name="city">
                {(field) => (
                  <FormField
                    label="City"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Kuala Lumpur"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="state">
                {(field) => (
                  <FormField
                    label="State"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Selangor"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="postalCode">
                {(field) => (
                  <FormField
                    label="Postal Code"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="50000"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="country">
                {(field) => (
                  <FormField
                    label="Country"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Malaysia"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>
          </div>

          <Separator />

          <DialogFooter className="px-6 py-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  style={{ background: ACCENT }}
                  className="text-white hover:opacity-90"
                >
                  {isSubmitting || isPending ? "Creating…" : "Create Receptionist"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditReceptionistDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that lets the admin edit a receptionist's details
function EditReceptionistDialog({ receptionist, open, onOpenChange }: EditReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminUpdateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist updated successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to update receptionist");
        }
      },
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: receptionist?.firstName ?? "",
      lastName: receptionist?.lastName ?? "",
      username: receptionist?.username ?? "",
      email: receptionist?.email ?? "",
      phoneNumber: receptionist?.phoneNumber ?? "",
      gender: (receptionist?.gender ?? "N") as "M" | "F" | "O" | "N",
      dateOfBirth: receptionist?.dateOfBirth ?? "",
      street: receptionist?.address?.street ?? "",
      city: receptionist?.address?.city ?? "",
      state: receptionist?.address?.state ?? "",
      postalCode: receptionist?.address?.postalCode ?? "",
      country: receptionist?.address?.country ?? "",
    },
    validators: { onSubmit: editReceptionistSchema },
    onSubmit: async ({ value }) => {
      if (!receptionist?.publicId) return;
      mutate({
        id: receptionist.publicId,
        data: {
          firstName: value.firstName,
          lastName: value.lastName,
          username: value.username,
          email: value.email,
          phoneNumber: value.phoneNumber || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          address: value.street
            ? {
                street: value.street,
                city: value.city,
                state: value.state,
                postalCode: value.postalCode,
                country: value.country,
              }
            : null,
        },
      });
    },
  });

  if (!receptionist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Edit Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update the details for{" "}
            <span className="font-medium text-foreground">
              {receptionist.firstName} {receptionist.lastName}
            </span>
            . Changes are not saved until you click Save.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="max-h-[60vh] overflow-y-auto px-6 pb-2">
            {/* Personal information section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Personal Information
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field name="firstName">
                {(field) => (
                  <FormField
                    label="First Name"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="First name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="lastName">
                {(field) => (
                  <FormField
                    label="Last Name"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Last name"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="username">
                {(field) => (
                  <FormField
                    label="Username"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="username"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="email">
                {(field) => (
                  <FormField
                    label="Email"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="email@example.com"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="phoneNumber">
                {(field) => (
                  <FormField
                    label="Phone Number"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="+60 12-345 6789"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="gender">
                {(field) => (
                  <FormField
                    label="Gender"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange((v ?? "N") as "M" | "F" | "O" | "N")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="O">Other</SelectItem>
                        <SelectItem value="N">Not specified</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              </form.Field>

              <form.Field name="dateOfBirth">
                {(field) => (
                  <FormField
                    label="Date of Birth"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                    />
                  </FormField>
                )}
              </form.Field>
            </div>

            {/* Address section */}
            <p
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: ACCENT }}
            >
              Address
            </p>
            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <form.Field name="street">
                  {(field) => (
                    <FormField
                      label="Street"
                      error={
                        field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                      }
                    >
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="123 Main St"
                      />
                    </FormField>
                  )}
                </form.Field>
              </div>

              <form.Field name="city">
                {(field) => (
                  <FormField
                    label="City"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Kuala Lumpur"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="state">
                {(field) => (
                  <FormField
                    label="State"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Selangor"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="postalCode">
                {(field) => (
                  <FormField
                    label="Postal Code"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="50000"
                    />
                  </FormField>
                )}
              </form.Field>

              <form.Field name="country">
                {(field) => (
                  <FormField
                    label="Country"
                    error={
                      field.state.meta.errors[0] ? String(field.state.meta.errors[0]) : undefined
                    }
                  >
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Malaysia"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>
          </div>

          <Separator />

          <DialogFooter className="px-6 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(s) => s.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  style={{ background: ACCENT }}
                  className="text-white hover:opacity-90"
                >
                  {isSubmitting || isPending ? "Saving…" : "Save changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ReceptionistDetailsDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal dialog that shows full receptionist profile not visible in the table
function ReceptionistDetailsDialog({
  receptionist,
  open,
  onOpenChange,
}: ReceptionistDetailsDialogProps) {
  if (!receptionist) return null;

  const initials = `${receptionist.firstName[0]}${receptionist.lastName[0]}`;
  const fullAddress = receptionist.address
    ? `${receptionist.address.street}, ${receptionist.address.city}, ${receptionist.address.state} ${receptionist.address.postalCode}, ${receptionist.address.country}`
    : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        {/* Header accent band */}
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            {/* Avatar with S3 image or initials fallback */}
            {receptionist.avatarUrl ? (
              <img
                src={receptionist.avatarUrl}
                alt={`${receptionist.firstName} ${receptionist.lastName}`}
                className="size-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ background: ACCENT }}
              >
                {initials}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl font-semibold leading-none">
                  {receptionist.firstName} {receptionist.lastName}
                </DialogTitle>
              </div>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-mono text-xs text-muted-foreground">
                  @{receptionist.username}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
          {/* Personal details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Personal Information
          </p>
          <div className="mb-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailRow label="IC Number" value={receptionist.icNumber} />
            <DetailRow label="Gender" value={genderLabel(receptionist.gender)} />
            <DetailRow
              label="Date of Birth"
              value={receptionist.dateOfBirth ? formatDate(receptionist.dateOfBirth) : "—"}
            />
          </div>

          {/* Contact details */}
          <p
            className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: ACCENT }}
          >
            Address
          </p>
          <div className="mb-5 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground/80">
            {fullAddress}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DeactivateReceptionistDialogProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Confirmation dialog before soft-deleting a receptionist account
function DeactivateReceptionistDialog({
  receptionist,
  open,
  onOpenChange,
}: DeactivateReceptionistDialogProps) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminDeactivateReceptionist({
    mutation: {
      onSuccess: () => {
        toast.success("Receptionist removed successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllReceptionistsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to remove receptionist");
        }
      },
    },
  });

  if (!receptionist) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-destructive" />
        <DialogHeader className="px-6 pb-4 pt-7">
          <DialogTitle className="text-xl font-semibold">Remove Receptionist</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {receptionist.firstName} {receptionist.lastName}
            </span>
            ? Their account will be disabled and they will no longer be able to log in. This action
            cannot be undone from the portal.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <DialogFooter className="px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              if (receptionist.publicId) {
                mutate({ id: receptionist.publicId.toString() });
              }
            }}
          >
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Admin page displaying a paginated, searchable list of all receptionists
export function AdminReceptionistsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReceptionist, setSelectedReceptionist] = useState<AdminReceptionistDto | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReceptionist, setEditReceptionist] = useState<AdminReceptionistDto | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deactivateReceptionist, setDeactivateReceptionist] = useState<AdminReceptionistDto | null>(
    null,
  );
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  const handleDeactivate = (receptionist: AdminReceptionistDto) => {
    setDeactivateReceptionist(receptionist);
    setDeactivateDialogOpen(true);
  };

  const handleView = (receptionist: AdminReceptionistDto) => {
    setSelectedReceptionist(receptionist);
    setDialogOpen(true);
  };

  const handleEdit = (receptionist: AdminReceptionistDto) => {
    setEditReceptionist(receptionist);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isError } = useAdminGetAllReceptionists({
    Page: page,
    PageSize: PAGE_SIZE,
    Search: search || undefined,
  });

  const result = data?.status === 200 ? data.data : null;
  const receptionists = result?.items ?? [];
  const totalCount = result ? Number(result.totalCount) : 0;
  const totalPages = result ? Number(result.totalPages ?? 1) : 1;

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
              <BreadcrumbPage>Receptionist Directory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mt-3 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Receptionist Directory</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {isLoading
            ? "Loading..."
            : `Total: ${totalCount} personnel currently managed within the system.`}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          <div className="absolute inset-x-0 top-0 h-0.75" style={{ background: ACCENT }} />

          <div className="p-6">
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground tracking-wide">
                  Loading receptionists…
                </p>
              </div>
            ) : isError ? (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-destructive">Failed to load receptionists.</p>
              </div>
            ) : (
              <ReceptionistTable
                data={receptionists}
                page={page}
                totalPages={totalPages}
                hasNextPage={result?.hasNextPage}
                hasPreviousPage={result?.hasPreviousPage}
                onPageChange={setPage}
                search={searchInput}
                onSearchChange={setSearchInput}
                onView={handleView}
                onEdit={handleEdit}
                onDeactivate={handleDeactivate}
                onAddNew={() => setAddDialogOpen(true)}
              />
            )}
          </div>
        </div>
      </motion.div>

      <ReceptionistDetailsDialog
        receptionist={selectedReceptionist}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      <EditReceptionistDialog
        key={editReceptionist?.publicId}
        receptionist={editReceptionist}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <AddReceptionistDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      <DeactivateReceptionistDialog
        key={deactivateReceptionist?.publicId?.toString()}
        receptionist={deactivateReceptionist}
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
      />
    </>
  );
}
