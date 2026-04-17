import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmergencyContactFormProps } from "../types";
import { FormField } from "./FormField";

export function EmergencyContactForm({ form }: EmergencyContactFormProps) {
  return (
    <form.Field name="emergencyContact">
      {(field) => (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Emergency Contact</h3>
            {field.state.value === null ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => field.handleChange({ name: "", relationship: "", phone: "" })}
              >
                <Plus className="mr-1 size-3" /> Add Contact
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 cursor-pointer"
                onClick={() => field.handleChange(null)}
              >
                <Trash2 className="mr-1 size-3" /> Remove
              </Button>
            )}
          </div>

          {field.state.value === null ? (
            <p className="text-sm text-muted-foreground italic">No emergency contact on record.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <form.Field name="emergencyContact.name">
                {(subField) => (
                  <FormField
                    label={<span className="text-xs">Full Name</span>}
                    htmlFor={`${subField.name}-input`}
                    error={subField.state.meta.errors[0]?.message}
                  >
                    <Input
                      id={`${subField.name}-input`}
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="Jane Doe"
                    />
                  </FormField>
                )}
              </form.Field>
              <form.Field name="emergencyContact.relationship">
                {(subField) => (
                  <FormField
                    label={<span className="text-xs">Relationship</span>}
                    htmlFor={`${subField.name}-input`}
                    error={subField.state.meta.errors[0]?.message}
                  >
                    <Input
                      id={`${subField.name}-input`}
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="Spouse"
                    />
                  </FormField>
                )}
              </form.Field>
              <form.Field name="emergencyContact.phone">
                {(subField) => (
                  <FormField
                    label={<span className="text-xs">Phone Number</span>}
                    htmlFor={`${subField.name}-input`}
                    error={subField.state.meta.errors[0]?.message}
                  >
                    <Input
                      id={`${subField.name}-input`}
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="+60123456789"
                    />
                  </FormField>
                )}
              </form.Field>
            </div>
          )}
        </div>
      )}
    </form.Field>
  );
}
