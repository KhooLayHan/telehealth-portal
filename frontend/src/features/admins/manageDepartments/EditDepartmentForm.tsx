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
import type { DepartmentTableRow } from "./UseDepartmentsTable";

const MAX_DEPARTMENT_NAME_LENGTH = 100;
const MAX_DEPARTMENT_DESCRIPTION_LENGTH = 500;

// Validates department detail edits before they are saved locally.
const editDepartmentSchema = z.object({
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

// Describes the values captured by the edit-department form.
type EditDepartmentFormValues = z.infer<typeof editDepartmentSchema>;

// Describes the local-only department update emitted by the edit form.
export interface EditDepartmentDetails {
  id: string;
  name: string;
  description: string;
}

// Props for controlling the edit-department dialog from the department page.
interface EditDepartmentFormProps {
  department: DepartmentTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (department: EditDepartmentDetails) => void | Promise<void>;
}

// Props for the mounted edit-department form content.
interface EditDepartmentFormContentProps {
  department: DepartmentTableRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (department: EditDepartmentDetails) => void | Promise<void>;
}

// Converts a department table row into the default values used by the form.
function buildEditDepartmentValues(department: DepartmentTableRow): EditDepartmentFormValues {
  return {
    name: department.name,
    description: department.description,
  };
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

// Renders the selected department edit dialog when a table row is active.
export function EditDepartmentForm({
  department,
  open,
  onOpenChange,
  onSave,
}: EditDepartmentFormProps) {
  if (!department) {
    return null;
  }

  return (
    <EditDepartmentFormContent
      key={department.id}
      department={department}
      open={open}
      onOpenChange={onOpenChange}
      onSave={onSave}
    />
  );
}

// Renders a prefilled frontend-only form for editing department details.
function EditDepartmentFormContent({
  department,
  open,
  onOpenChange,
  onSave,
}: EditDepartmentFormContentProps) {
  const form = useForm({
    defaultValues: buildEditDepartmentValues(department),
    validators: { onSubmit: editDepartmentSchema },
    onSubmit: async ({ value }) => {
      await onSave?.({
        id: department.id,
        name: value.name.trim(),
        description: value.description.trim(),
      });

      toast.success("Department details updated locally");
      onOpenChange(false);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset(buildEditDepartmentValues(department));
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
              <DialogTitle className="text-xl font-semibold">Edit Department Details</DialogTitle>
              <DialogDescription>
                Update the department name and internal admin description before backend saving is
                connected.
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
                      Use the name admins and staff will recognize in department lists.
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
                      placeholder="Briefly describe this department's coverage, services, or focus areas."
                      aria-invalid={isInvalid}
                      onBlur={field.handleBlur}
                      onChange={(event) => field.handleChange(event.target.value)}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <FieldDescription>
                        Optional context for admins reviewing department coverage.
                      </FieldDescription>
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
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button type="submit" className="gap-1.5" disabled={isSubmitting}>
                  <Check className="size-4" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
