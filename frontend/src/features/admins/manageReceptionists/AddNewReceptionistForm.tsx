import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Plus } from "lucide-react";
import { useState } from "react";
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

// Lists the gender codes accepted by the receptionist registration UI.
const GENDERS = ["M", "F", "N"] as const;

// Lists the Malaysian states and federal territories available for addresses.
const MALAYSIA_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan Kuala Lumpur",
  "Wilayah Persekutuan Labuan",
  "Wilayah Persekutuan Putrajaya",
] as const;

// Matches Malaysian IC numbers in the backend format: 12 digits without dashes.
const MALAYSIAN_IC_REGEX = /^\d{12}$/;

// Matches names that contain only ASCII letters and spaces.
const NAME_REGEX = /^[A-Za-z ]+$/;

// Matches usernames that contain only letters, numbers, underscores, and dots.
const USERNAME_REGEX = /^[A-Za-z0-9_.]+$/;

// Matches international phone numbers with a + prefix and 11-12 digits.
const PHONE_NUMBER_REGEX = /^\+\d{11,12}$/;

// Checks that a form date string is not later than today's local date.
function isNotFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate <= today;
}

// Zod schema for validating the add receptionist form
const addReceptionistSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "First name is required")
      .max(20, "First name must be 20 characters or fewer")
      .regex(NAME_REGEX, "First name can contain letters and spaces only"),
    lastName: z
      .string()
      .trim()
      .min(1, "Last name is required")
      .max(20, "Last name must be 20 characters or fewer")
      .regex(NAME_REGEX, "Last name can contain letters and spaces only"),
    username: z
      .string()
      .trim()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be 20 characters or fewer")
      .regex(USERNAME_REGEX, "Username can contain letters, numbers, underscores, and dots only"),
    email: z.string().trim().min(1, "Email is required").email("Must be a valid email").max(254),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    icNumber: z
      .string()
      .trim()
      .regex(MALAYSIAN_IC_REGEX, "IC number must be exactly 12 digits without dashes"),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || PHONE_NUMBER_REGEX.test(value),
        "Phone number must be 12-13 characters starting with + followed by digits only",
      ),
    gender: z.enum(GENDERS, { message: "Gender must be male, female, or prefer not to say" }),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(isNotFutureDate, "Date of birth cannot be in the future"),
    street: z.string().trim().max(200),
    city: z.string().trim().max(100),
    state: z.union([z.literal(""), z.enum(MALAYSIA_STATES)]),
    postalCode: z.string().trim().max(20),
    country: z.literal("Malaysia"),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    const addressFields = [
      { field: "street", message: "Street is required", value: value.street },
      { field: "city", message: "City is required", value: value.city },
      { field: "state", message: "State is required", value: value.state },
      { field: "postalCode", message: "Postal code is required", value: value.postalCode },
    ] as const;
    const hasAddress = addressFields.some((field) => field.value.length > 0);

    if (!hasAddress) {
      return;
    }

    for (const field of addressFields) {
      if (field.value.length === 0) {
        context.addIssue({
          code: "custom",
          message: field.message,
          path: [field.field],
        });
      }
    }
  });

// Describes the values collected by the add receptionist form.
type AddReceptionistFormValues = z.infer<typeof addReceptionistSchema>;

// Default values used whenever the add receptionist dialog is opened
const addReceptionistDefaultValues: AddReceptionistFormValues = {
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
  country: "Malaysia",
};

// Describes the open state controls for the add receptionist dialog
interface AddNewReceptionistFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal form for registering a new receptionist account
export function AddNewReceptionistForm({ open, onOpenChange }: AddNewReceptionistFormProps) {
  const [showPassword, setShowPassword] = useState(false);
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
    defaultValues: addReceptionistDefaultValues,
    validators: { onSubmit: addReceptionistSchema },
    onSubmit: async ({ value }) => {
      const address = {
        street: value.street.trim(),
        city: value.city.trim(),
        state: value.state.trim(),
        postalCode: value.postalCode.trim(),
        country: value.country,
      };
      const hasAddress = [address.street, address.city, address.state, address.postalCode].some(
        (addressValue) => addressValue.length > 0,
      );

      mutate({
        data: {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          username: value.username.trim(),
          email: value.email.trim(),
          password: value.password,
          phoneNumber: value.phoneNumber.trim() || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          icNumber: value.icNumber.trim(),
          address: hasAddress ? address : null,
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
                Add New Receptionist
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Fill in the receptionist&apos;s details to register them in the system.
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
                      <FieldLabel>First Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Nur"
                        maxLength={20}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="lastName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Last Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Aisyah"
                        maxLength={20}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="icNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>IC Number</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 900101011234"
                      maxLength={12}
                      className="font-mono"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                        placeholder="e.g. 0123456789"
                        inputMode="numeric"
                        maxLength={10}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                          field.handleChange((value ?? "N") as AddReceptionistFormValues["gender"])
                        }
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="N">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. reception_nur"
                        autoComplete="off"
                        maxLength={20}
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>

                <form.Field name="email">
                  {(field) => (
                    <Field>
                      <FieldLabel>Email</FieldLabel>
                      <Input
                        type="email"
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. receptionist@hospital.com"
                        autoComplete="off"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <form.Field name="password">
                {(field) => (
                  <Field>
                    <FieldLabel>Password</FieldLabel>
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
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>

              <form.Field name="confirmPassword">
                {(field) => (
                  <Field>
                    <FieldLabel>Confirm Password</FieldLabel>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={field.state.value}
                      onChange={(event) => field.handleChange(event.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="state">
                  {(field) => (
                    <Field>
                      <FieldLabel>State</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(value) =>
                          field.handleChange(value as AddReceptionistFormValues["state"])
                        }
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {MALAYSIA_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="country">
                  {(field) => (
                    <Field>
                      <FieldLabel>Country</FieldLabel>
                      <Input
                        value={field.state.value}
                        readOnly
                        onBlur={field.handleBlur}
                        aria-readonly="true"
                        className="bg-muted text-muted-foreground"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
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
                  {isSubmitting || isPending ? "Creating..." : "Create Receptionist"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
