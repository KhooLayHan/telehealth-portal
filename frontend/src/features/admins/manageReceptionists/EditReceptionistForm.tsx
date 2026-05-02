import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllReceptionistsQueryKey,
  useAdminUpdateReceptionist,
} from "@/api/generated/admins/admins";
import type { AdminReceptionistDto } from "@/api/model/AdminReceptionistDto";
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

// Lists the gender codes accepted by the receptionist update UI.
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

// Matches usernames that contain only letters, numbers, and underscores.
const USERNAME_REGEX = /^[A-Za-z0-9_]+$/;

// Matches optional Malaysian-style phone input as exactly 10 digits.
const PHONE_NUMBER_REGEX = /^\d{10}$/;

// Checks that a form date string is not later than today's local date.
function isNotFutureDate(value: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(`${value}T00:00:00`);

  return !Number.isNaN(selectedDate.getTime()) && selectedDate <= today;
}

// Zod schema for validating the receptionist edit form
const editReceptionistSchema = z
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
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be 20 characters or fewer")
      .regex(USERNAME_REGEX, "Username can contain letters, numbers, and underscores only"),
    email: z.string().trim().min(1, "Email is required").email("Must be a valid email").max(254),
    icNumber: z
      .string()
      .trim()
      .regex(MALAYSIAN_IC_REGEX, "IC number must be exactly 12 digits without dashes"),
    phoneNumber: z
      .string()
      .trim()
      .refine(
        (value) => value.length === 0 || PHONE_NUMBER_REGEX.test(value),
        "Phone number must be exactly 10 digits",
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

// Describes the values collected by the edit receptionist form.
type EditReceptionistFormValues = z.infer<typeof editReceptionistSchema>;

// Builds form defaults from the selected receptionist record
function buildEditDefaultValues(
  receptionist: AdminReceptionistDto | null,
): EditReceptionistFormValues {
  return {
    firstName: receptionist?.firstName ?? "",
    lastName: receptionist?.lastName ?? "",
    username: receptionist?.username ?? "",
    email: receptionist?.email ?? "",
    icNumber: receptionist?.icNumber ?? "",
    phoneNumber: receptionist?.phoneNumber ?? "",
    gender: (receptionist?.gender ?? "N") as EditReceptionistFormValues["gender"],
    dateOfBirth: receptionist?.dateOfBirth ?? "",
    street: receptionist?.address?.street ?? "",
    city: receptionist?.address?.city ?? "",
    state: (receptionist?.address?.state ?? "") as EditReceptionistFormValues["state"],
    postalCode: receptionist?.address?.postalCode ?? "",
    country: "Malaysia",
  };
}

// Describes the open state controls and selected receptionist for the edit dialog
interface EditReceptionistFormProps {
  receptionist: AdminReceptionistDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Modal form that lets the admin update an existing receptionist account
export function EditReceptionistForm({
  receptionist,
  open,
  onOpenChange,
}: EditReceptionistFormProps) {
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
    defaultValues: buildEditDefaultValues(receptionist),
    validators: { onSubmit: editReceptionistSchema },
    onSubmit: async ({ value }) => {
      if (!receptionist?.publicId) return;

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
        id: receptionist.publicId,
        data: {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          username: value.username.trim(),
          email: value.email.trim(),
          icNumber: value.icNumber.trim(),
          phoneNumber: value.phoneNumber.trim() || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          address: hasAddress ? address : null,
        },
      });
    },
  });

  if (!receptionist) return null;

  const initials = `${receptionist.firstName[0] ?? "?"}${receptionist.lastName[0] ?? "?"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Edit {receptionist.firstName} {receptionist.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Update account details and save to apply changes.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
                          field.handleChange((value ?? "N") as EditReceptionistFormValues["gender"])
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. receptionist@hospital.com"
                        autoComplete="off"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
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
                      onChange={(e) => field.handleChange(e.target.value)}
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
                          field.handleChange(value as EditReceptionistFormValues["state"])
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
                        onChange={(e) => field.handleChange(e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                  {isSubmitting || isPending ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
