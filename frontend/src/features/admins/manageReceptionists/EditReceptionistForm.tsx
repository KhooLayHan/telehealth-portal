import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
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

// Builds form defaults from the selected receptionist record
function buildEditDefaultValues(receptionist: AdminReceptionistDto | null) {
  return {
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

  const initials = `${receptionist.firstName[0] ?? "?"}${receptionist.lastName[0] ?? "?"}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-px bg-border" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-none">
                Edit {receptionist.firstName} {receptionist.lastName}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
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
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="firstName">
                  {(field) => (
                    <Field>
                      <FieldLabel>First Name</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Nur"
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
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <form.Field name="phoneNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>Phone Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="+601x-xxxxxxx"
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
                          field.handleChange((value ?? "N") as "M" | "F" | "O" | "N")
                        }
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
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. reception.nur"
                        autoComplete="off"
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

              <div className="grid grid-cols-2 gap-4">
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
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Wilayah Persekutuan"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Malaysia"
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
                  className="bg-black text-white hover:bg-black/85"
                >
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
