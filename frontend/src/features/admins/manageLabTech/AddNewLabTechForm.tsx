import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllLabTechsQueryKey,
  useAdminCreateLabTech,
} from "@/api/generated/admins/admins";
import { ApiError } from "@/api/ofetch-mutator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Validates the add lab technician form before account creation.
const addLabTechSchema = z
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

// Describes the values collected by the add lab technician form.
type AddLabTechFormValues = z.infer<typeof addLabTechSchema>;

// Provides the initial empty state whenever the add lab technician dialog opens.
const addLabTechDefaultValues: AddLabTechFormValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  icNumber: "",
  phoneNumber: "",
  gender: "N",
  dateOfBirth: "",
  street: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

// Describes the open state controls for the add lab technician dialog.
interface AddNewLabTechFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Converts TanStack Form validation results into shadcn field error objects.
function toFieldErrors(errors: unknown[]): Array<{ message: string }> {
  return errors.map((error) => ({
    message:
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
        ? error.message
        : String(error),
  }));
}

// Modal form for registering a new lab technician account.
export function AddNewLabTechForm({ open, onOpenChange }: AddNewLabTechFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { mutate, isPending } = useAdminCreateLabTech({
    mutation: {
      onSuccess: () => {
        toast.success("Lab technician created successfully");
        queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
        form.reset();
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to create lab technician");
          return;
        }

        toast.error("Failed to create lab technician");
      },
    },
  });

  const form = useForm({
    defaultValues: addLabTechDefaultValues,
    validators: { onSubmit: addLabTechSchema },
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
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              <Plus className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Add New Lab Technician
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Fill in the lab technician&apos;s details to register them in the system.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col"
        >
          <Tabs defaultValue="personal" className="flex-1 px-6 pb-2">
            <TabsList className="mb-5 grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
            </TabsList>

            <TabsContent
              value="personal"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        First Name
                        <span className="ml-0.5 text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Nur"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Last Name
                        <span className="ml-0.5 text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Aisyah"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="icNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      IC Number
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 900101011234"
                      maxLength={12}
                      className="font-mono"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+601x-xxxxxxx"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="gender">
                  {(field) => (
                    <Field>
                      <FieldLabel>Gender</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange((value ?? "N") as "M" | "F" | "O" | "N")
                        }
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="O">Other</SelectItem>
                          <SelectItem value="N">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="dateOfBirth">
                {(field) => (
                  <Field>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="account"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Username
                        <span className="ml-0.5 text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. lab.nur"
                        autoComplete="off"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel>
                        Email
                        <span className="ml-0.5 text-destructive" aria-hidden>
                          *
                        </span>
                      </FieldLabel>
                      <Input
                        type="email"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. labtech@hospital.com"
                        autoComplete="off"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Password
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <Field>
                    <FieldLabel>
                      Confirm Password
                      <span className="ml-0.5 text-destructive" aria-hidden>
                        *
                      </span>
                    </FieldLabel>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="address"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="street">
                {(field) => (
                  <Field>
                    <FieldLabel>Street</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 123 Jalan Ampang"
                    />
                    <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                  </Field>
                )}
              </form.Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="city">
                  {(field) => (
                    <Field>
                      <FieldLabel>City</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Kuala Lumpur"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="state">
                  {(field) => (
                    <Field>
                      <FieldLabel>State</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Wilayah Persekutuan"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <form.Field name="postalCode">
                  {(field) => (
                    <Field>
                      <FieldLabel>Postal Code</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. 50450"
                        className="font-mono"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Malaysia"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
                    </Field>
                  )}
                </form.Field>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting || isPending}
                  className="gap-1.5"
                >
                  <Check className="size-4" />
                  {isSubmitting || isPending ? "Creating..." : "Create Lab Technician"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
