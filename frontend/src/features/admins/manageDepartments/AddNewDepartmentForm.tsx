import { useForm } from "@tanstack/react-form";
import { Building2, Check } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MAX_DEPARTMENT_NAME_LENGTH = 100;
const MAX_DEPARTMENT_DESCRIPTION_LENGTH = 500;

// Validates the frontend-only department form before a backend endpoint exists.
const addDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Department name is required")
    .max(MAX_DEPARTMENT_NAME_LENGTH, "Department name must be 100 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(MAX_DEPARTMENT_DESCRIPTION_LENGTH, "Description must be 500 characters or fewer"),
});

// Describes the values captured by the add-department form.
type AddDepartmentFormValues = z.infer<typeof addDepartmentSchema>;

// Props for controlling the add-department dialog from the department page.
interface AddNewDepartmentFormProps {
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

// Renders a frontend-only dialog form for collecting new department details.
export function AddNewDepartmentForm({ open, onOpenChange }: AddNewDepartmentFormProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
    } satisfies AddDepartmentFormValues,
    validators: { onSubmit: addDepartmentSchema },
    onSubmit: async () => {
      toast.info("Department form is ready. Backend save is not connected yet.");
      form.reset();
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <DialogHeader className="px-6 pb-4 pt-7">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="text-xl font-semibold">Add New Department</DialogTitle>
              <DialogDescription>
                Create the department profile now; backend saving will be connected later.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <div className="space-y-5 px-6 pb-6">
            <form.Field name="name">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Department Name</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      maxLength={MAX_DEPARTMENT_NAME_LENGTH}
                      placeholder="e.g. Cardiology"
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <FieldDescription>
                      This name appears in department lists and staff assignment screens.
                    </FieldDescription>
                    {isInvalid && <FieldError errors={toFieldErrors(field.state.meta.errors)} />}
                  </Field>
                );
              }}
            </form.Field>

            <form.Field name="description">
              {(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                    <Textarea
                      id={field.name}
                      value={field.state.value}
                      maxLength={MAX_DEPARTMENT_DESCRIPTION_LENGTH}
                      rows={4}
                      placeholder="Briefly describe the department coverage, services, or focus areas."
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <FieldDescription>Optional, but helpful for admin context.</FieldDescription>
                      <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                        {field.state.value.length}/{MAX_DEPARTMENT_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                    {isInvalid && <FieldError errors={toFieldErrors(field.state.meta.errors)} />}
                  </Field>
                );
              }}
            </form.Field>
          </div>

          <DialogFooter className="px-6 py-4">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5">
              <Check className="size-4" />
              Create Department
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
