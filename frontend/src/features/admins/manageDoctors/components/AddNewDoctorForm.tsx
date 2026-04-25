import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getGetAllQueryKey,
  useCreateDoctor,
} from "@/api/generated/doctors/doctors";
import type { CreateDoctorCommand } from "@/api/model/CreateDoctorCommand";
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
import { Textarea } from "@/components/ui/textarea";

const ACCENT = "#0d9488";

const addDoctorSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  username: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  icNumber: z.string().min(1, "Required"),
  phoneNumber: z.string(),
  gender: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  bio: z.string(),
  specialization: z.string().min(1, "Required"),
  licenseNumber: z.string().min(1, "Required"),
  consultationFee: z.number().nonnegative("Must be ≥ 0").nullable(),
  departmentName: z.string().min(1, "Required"),
  addressStreet: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressPostalCode: z.string(),
  addressCountry: z.string(),
  qualifications: z.array(
    z.object({
      degree: z.string().min(1, "Required"),
      institution: z.string().min(1, "Required"),
      year: z.number().int().min(1900, "Min 1900").max(2100, "Max 2100"),
    }),
  ),
});

const addDoctorDefaultValues = {
  firstName: "",
  lastName: "",
  username: "",
  email: "",
  password: "",
  icNumber: "",
  phoneNumber: "",
  gender: "",
  dateOfBirth: "",
  bio: "",
  specialization: "",
  licenseNumber: "",
  consultationFee: null as number | null,
  departmentName: "",
  addressStreet: "",
  addressCity: "",
  addressState: "",
  addressPostalCode: "",
  addressCountry: "",
  qualifications: [] as Array<{ degree: string; institution: string; year: number }>,
};

interface AddNewDoctorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddNewDoctorForm({ open, onOpenChange }: AddNewDoctorFormProps) {
  const qualKeysRef = useRef<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useCreateDoctor();

  const form = useForm({
    defaultValues: addDoctorDefaultValues,
    validators: { onSubmit: addDoctorSchema },
    onSubmit: async ({ value }) => {
      const payload: CreateDoctorCommand = {
        firstName: value.firstName,
        lastName: value.lastName,
        username: value.username,
        email: value.email,
        password: value.password,
        icNumber: value.icNumber,
        phoneNumber: value.phoneNumber || null,
        gender: value.gender[0] ?? "N",
        dateOfBirth: value.dateOfBirth,
        bio: value.bio || null,
        specialization: value.specialization,
        licenseNumber: value.licenseNumber,
        consultationFee: value.consultationFee,
        departmentName: value.departmentName,
        address: value.addressStreet
          ? {
              street: value.addressStreet,
              city: value.addressCity,
              state: value.addressState,
              postalCode: value.addressPostalCode,
              country: value.addressCountry,
            }
          : null,
        qualifications: value.qualifications.map((q) => ({
          degree: q.degree,
          institution: q.institution,
          year: q.year,
        })),
      };

      try {
        await mutateAsync({ data: payload });
        toast.success(`Dr. ${value.firstName} ${value.lastName} has been added.`);
        await queryClient.invalidateQueries({ queryKey: getGetAllQueryKey() });
        onOpenChange(false);
      } catch (error) {
        if (error instanceof ApiError) {
          toast.error(error.data?.title ?? "Failed to add doctor.");
        } else {
          toast.error("Failed to add doctor.");
        }
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: ACCENT }} />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-4">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
              style={{ background: ACCENT }}
            >
              <Plus className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold leading-none">
                Add New Doctor
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Fill in the doctor&apos;s details to register them in the system.
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
            <TabsList className="mb-5 grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
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
                        placeholder="e.g. Ahmad"
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
                        placeholder="e.g. Rahman"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="username">
                  {(field) => (
                    <Field>
                      <FieldLabel>Username</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. dr.ahmad"
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
                        placeholder="e.g. dr.ahmad@hospital.com"
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
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="Min 8 chars, 1 uppercase, 1 number"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
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
              <form.Field name="icNumber">
                {(field) => (
                  <Field>
                    <FieldLabel>IC Number</FieldLabel>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder="e.g. 820101-14-5678"
                      className="font-mono"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
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
                        onValueChange={(v) => field.handleChange(v ?? "")}
                      >
                        <SelectTrigger className="w-full" onBlur={field.handleBlur}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
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
              <form.Field name="bio">
                {(field) => (
                  <Field>
                    <FieldLabel>Bio</FieldLabel>
                    <Textarea
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      rows={3}
                      placeholder="Brief professional bio…"
                    />
                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                  </Field>
                )}
              </form.Field>
            </TabsContent>

            <TabsContent
              value="professional"
              className="mt-0 max-h-[52vh] space-y-4 overflow-y-auto pb-2 pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="specialization">
                  {(field) => (
                    <Field>
                      <FieldLabel>Specialization</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="departmentName">
                  {(field) => (
                    <Field>
                      <FieldLabel>Department</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. Cardiology Department"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <form.Field name="licenseNumber">
                  {(field) => (
                    <Field>
                      <FieldLabel>License Number</FieldLabel>
                      <Input
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder="e.g. MMC12345"
                        className="font-mono"
                      />
                      <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                    </Field>
                  )}
                </form.Field>
                <form.Field name="consultationFee">
                  {(field) => (
                    <Field>
                      <FieldLabel>Consultation Fee (MYR)</FieldLabel>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(e.target.value === "" ? null : Number(e.target.value))
                        }
                        onBlur={field.handleBlur}
                        placeholder="e.g. 150.00"
                        className="font-mono"
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
              <form.Field name="addressStreet">
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
                <form.Field name="addressCity">
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
                <form.Field name="addressState">
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
                <form.Field name="addressPostalCode">
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
                <form.Field name="addressCountry">
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

            <TabsContent
              value="qualifications"
              className="mt-0 max-h-[52vh] overflow-y-auto pb-2 pr-1"
            >
              <form.Field name="qualifications" mode="array">
                {(field) => (
                  <div className="space-y-3">
                    {field.state.value.map((_, i) => (
                      <div
                        key={qualKeysRef.current[i]}
                        className="relative rounded-lg border border-border bg-muted/30 p-4"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="Remove qualification"
                          onClick={() => {
                            qualKeysRef.current.splice(i, 1);
                            field.removeValue(i);
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>

                        <div className="grid grid-cols-3 gap-3">
                          <form.Field name={`qualifications[${i}].degree`}>
                            {(degreeField) => (
                              <Field>
                                <FieldLabel>Degree</FieldLabel>
                                <Input
                                  value={degreeField.state.value}
                                  onChange={(e) => degreeField.handleChange(e.target.value)}
                                  onBlur={degreeField.handleBlur}
                                  placeholder="e.g. MBBS"
                                />
                                <FieldError
                                  errors={
                                    degreeField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].institution`}>
                            {(instField) => (
                              <Field>
                                <FieldLabel>Institution</FieldLabel>
                                <Input
                                  value={instField.state.value}
                                  onChange={(e) => instField.handleChange(e.target.value)}
                                  onBlur={instField.handleBlur}
                                  placeholder="e.g. University of Malaya"
                                />
                                <FieldError
                                  errors={
                                    instField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>

                          <form.Field name={`qualifications[${i}].year`}>
                            {(yearField) => (
                              <Field>
                                <FieldLabel>Year</FieldLabel>
                                <Input
                                  type="number"
                                  value={yearField.state.value}
                                  onChange={(e) => yearField.handleChange(Number(e.target.value))}
                                  onBlur={yearField.handleBlur}
                                  placeholder="e.g. 2010"
                                  className="font-mono"
                                />
                                <FieldError
                                  errors={
                                    yearField.state.meta.errors as Array<{ message?: string }>
                                  }
                                />
                              </Field>
                            )}
                          </form.Field>
                        </div>
                      </div>
                    ))}

                    {field.state.value.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No qualifications added yet.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        qualKeysRef.current.push(crypto.randomUUID());
                        field.pushValue({
                          degree: "",
                          institution: "",
                          year: new Date().getFullYear(),
                        });
                      }}
                    >
                      <Plus className="mr-1.5 size-3.5" />
                      Add Qualification
                    </Button>
                  </div>
                )}
              </form.Field>
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
                  style={{ background: ACCENT }}
                >
                  {isSubmitting || isPending ? "Adding…" : "Add Doctor"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
