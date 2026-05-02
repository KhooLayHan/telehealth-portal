import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getAdminGetAllLabTechsQueryKey,
  useAdminUpdateLabTech,
} from "@/api/generated/admins/admins";
import type { AdminLabTechDto } from "@/api/model/AdminLabTechDto";
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

// Matches Malaysian IC numbers in the backend format: 12 digits without dashes.
const malaysianIcRegex = /^\d{12}$/;

// Matches names that contain letters and spaces only.
const nameRegex = /^[A-Za-z ]+$/;

// Matches usernames that contain letters, numbers, underscores, and dots only.
const usernameRegex = /^[A-Za-z0-9_.]+$/;

// Matches international phone numbers with a + prefix and 11-12 digits.
const phoneNumberRegex = /^\+\d{11,12}$/;

// Stores the fixed country value used for lab technician addresses.
const malaysiaCountry = "Malaysia";

// Lists the selectable Malaysian states and federal territories.
const malaysiaStates: readonly string[] = [
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
  "Kuala Lumpur",
  "Labuan",
  "Putrajaya",
] as const;

// Validates a required person name using the lab technician naming rules.
const requiredName = (fieldName: string) =>
  z
    .string()
    .refine((value) => value.trim().length > 0, `${fieldName} is required`)
    .refine((value) => value.trim().length <= 20, `${fieldName} must be 20 characters or fewer`)
    .refine(
      (value) => value.trim().length === 0 || nameRegex.test(value.trim()),
      `${fieldName} may only contain letters and spaces`,
    );

// Validates usernames using the lab technician account naming rules.
const requiredUsername = z
  .string()
  .refine((value) => value.trim().length > 0, "Username is required")
  .refine((value) => value.trim().length === 0 || value.trim().length >= 3, {
    message: "Username must be at least 3 characters",
  })
  .refine((value) => value.trim().length <= 20, "Username must be 20 characters or fewer")
  .refine(
    (value) => value.trim().length === 0 || usernameRegex.test(value.trim()),
    "Username may only contain letters, numbers, underscores, and dots",
  );

// Validates optional trimmed text fields against backend length limits.
const optionalText = (fieldName: string, maxLength: number) =>
  z.string().trim().max(maxLength, `${fieldName} must be ${maxLength} characters or fewer`);

// Validates an optional phone number only when one is provided.
const optionalPhoneNumber = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || phoneNumberRegex.test(value), {
    message: "Phone must be 12-13 characters starting with + followed by digits only",
  });

// Checks that a date input value is a real date and not later than today's local date.
function isValidDateOfBirth(value: string): boolean {
  const dateOfBirthRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateOfBirthRegex.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const isRealDate =
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month - 1 &&
    selectedDate.getDate() === day;

  if (!isRealDate) {
    return false;
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;

  return value <= todayKey;
}

// Validates the lab technician edit form before local save.
const editLabTechSchema = z
  .object({
    firstName: requiredName("First name"),
    lastName: requiredName("Last name"),
    username: requiredUsername,
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Must be a valid email")
      .max(254, "Email must be 254 characters or fewer"),
    icNumber: z
      .string()
      .trim()
      .regex(malaysianIcRegex, "IC number must be exactly 12 digits without dashes"),
    phoneNumber: optionalPhoneNumber,
    gender: z.enum(["M", "F", "N"], {
      message: "Gender must be male, female, or prefer not to say",
    }),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine(
        (value) => value.length === 0 || isValidDateOfBirth(value),
        "Date of birth cannot be in the future",
      ),
    street: optionalText("Street", 200),
    city: optionalText("City", 100),
    state: z
      .string()
      .refine(
        (value) => value.length === 0 || malaysiaStates.includes(value),
        "Select a Malaysia state",
      ),
    postalCode: optionalText("Postal code", 20),
    country: z.literal(malaysiaCountry),
  })
  .superRefine((data, context) => {
    const addressFields = [
      { fieldName: "street", label: "Street", value: data.street },
      { fieldName: "city", label: "City", value: data.city },
      { fieldName: "state", label: "State", value: data.state },
      { fieldName: "postalCode", label: "Postal code", value: data.postalCode },
    ] as const;
    const hasAnyAddressValue = addressFields.some((field) => field.value.length > 0);

    if (!hasAnyAddressValue) {
      return;
    }

    for (const field of addressFields) {
      if (field.value.length === 0) {
        context.addIssue({
          code: "custom",
          message: `${field.label} is required when address is provided`,
          path: [field.fieldName],
        });
      }
    }
  });

// Describes the values collected by the edit lab technician form.
type EditLabTechFormValues = z.infer<typeof editLabTechSchema>;

// Builds form defaults from the selected lab technician record.
function buildEditDefaultValues(labTech: AdminLabTechDto): EditLabTechFormValues {
  return {
    firstName: labTech.firstName,
    lastName: labTech.lastName,
    username: labTech.username,
    email: labTech.email,
    icNumber: labTech.icNumber,
    phoneNumber: labTech.phoneNumber ?? "",
    gender: labTech.gender === "M" || labTech.gender === "F" ? labTech.gender : "N",
    dateOfBirth: labTech.dateOfBirth ?? "",
    street: labTech.address?.street ?? "",
    city: labTech.address?.city ?? "",
    state: labTech.address?.state ?? "",
    postalCode: labTech.address?.postalCode ?? "",
    country: malaysiaCountry,
  };
}

// Describes the open state controls and selected lab technician for the edit dialog.
interface EditLabTechFormProps {
  labTech: AdminLabTechDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Describes the mounted edit form once a lab technician row is selected.
interface EditLabTechFormContentProps {
  labTech: AdminLabTechDto;
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

// Renders the selected lab technician edit dialog when a table row is active.
export function EditLabTechForm({ labTech, open, onOpenChange }: EditLabTechFormProps) {
  if (!labTech) {
    return null;
  }

  return (
    <EditLabTechFormContent
      key={labTech.publicId}
      labTech={labTech}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

// Modal form that lets the admin update lab technician details through the backend.
function EditLabTechFormContent({ labTech, open, onOpenChange }: EditLabTechFormContentProps) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useAdminUpdateLabTech({
    mutation: {
      onSuccess: async () => {
        toast.success("Lab technician updated successfully");
        await queryClient.invalidateQueries({ queryKey: getAdminGetAllLabTechsQueryKey() });
        onOpenChange(false);
      },
      onError: (error) => {
        if (error instanceof ApiError) {
          toast.error(error.data.title ?? "Failed to update lab technician");
          return;
        }

        toast.error("Failed to update lab technician");
      },
    },
  });

  const form = useForm({
    defaultValues: buildEditDefaultValues(labTech),
    validators: { onSubmit: editLabTechSchema },
    onSubmit: async ({ value }) => {
      if (!labTech.publicId) {
        toast.error("Failed to update lab technician");
        return;
      }

      const firstName = value.firstName.trim();
      const lastName = value.lastName.trim();
      const username = value.username.trim();
      const email = value.email.trim();
      const icNumber = value.icNumber.trim();
      const phoneNumber = value.phoneNumber.trim();
      const street = value.street.trim();
      const city = value.city.trim();
      const state = value.state.trim();
      const postalCode = value.postalCode.trim();
      const hasAddress = [street, city, state, postalCode].some(
        (addressPart) => addressPart.length > 0,
      );

      await mutateAsync({
        id: labTech.publicId,
        data: {
          firstName,
          lastName,
          username,
          email,
          icNumber,
          phoneNumber: phoneNumber || null,
          gender: value.gender,
          dateOfBirth: value.dateOfBirth,
          address: hasAddress
            ? {
                street,
                city,
                state,
                postalCode,
                country: malaysiaCountry,
              }
            : null,
        },
      });
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset(buildEditDefaultValues(labTech));
    onOpenChange(nextOpen);
  };

  const initials = `${labTech.firstName[0] ?? "?"}${labTech.lastName[0] ?? "?"}`.toUpperCase();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pt-7 pb-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-lg text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-semibold text-xl leading-none">
                Edit {labTech.firstName} {labTech.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Update lab technician account details and save to apply changes.
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
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                        placeholder="e.g. 0123456789"
                        maxLength={10}
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
                          field.handleChange((value ?? "N") as "M" | "F" | "N")
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
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(event) => field.handleChange(event.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. lab_nur"
                        autoComplete="off"
                        maxLength={20}
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                        placeholder="e.g. labtech@hospital.com"
                        autoComplete="off"
                      />
                      <FieldError errors={toFieldErrors(field.state.meta.errors)} />
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
                      <Select
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {malaysiaStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        onBlur={field.handleBlur}
                        readOnly
                        aria-readonly="true"
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
