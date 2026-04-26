import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminCreateReceptionist,
} from "@/api/generated/admins/admins";
import { ApiError } from "@/api/ofetch-mutator";
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

const ACCENT = "#0d9488";

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

// Describes the open state controls for the add receptionist dialog
interface AddNewReceptionistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Describes a reusable labelled form field wrapper
interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

// Reusable labelled field wrapper used in the add receptionist form
function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-medium text-foreground/80">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Modal form for registering a new receptionist account
export function AddNewReceptionistForm({ open, onOpenChange }: AddNewReceptionistFormProps) {
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

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
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
