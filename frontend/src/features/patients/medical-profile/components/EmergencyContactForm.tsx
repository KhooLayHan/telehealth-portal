import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmergencyContactFormProps } from "../types";

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
                className="text-destructive hover:bg-destructive/10"
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
                  <div className="space-y-1.5">
                    <Label htmlFor={`${subField.name}-input`} className="text-xs">
                      Full Name
                    </Label>
                    <Input
                      id={`${subField.name}-input`}
                      aria-describedby={
                        subField.state.meta.errors.length > 0 ? `${subField.name}-error` : undefined
                      }
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="Jane Doe"
                    />
                    {subField.state.meta.errors.length > 0 && (
                      <p id={`${subField.name}-error`} className="text-xs text-destructive">
                        {subField.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="emergencyContact.relationship">
                {(subField) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={`${subField.name}-input`} className="text-xs">
                      Relationship
                    </Label>
                    <Input
                      id={`${subField.name}-input`}
                      aria-describedby={
                        subField.state.meta.errors.length > 0 ? `${subField.name}-error` : undefined
                      }
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="Spouse"
                    />
                    {subField.state.meta.errors.length > 0 && (
                      <p id={`${subField.name}-error`} className="text-xs text-destructive">
                        {subField.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
              <form.Field name="emergencyContact.phone">
                {(subField) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={`${subField.name}-input`} className="text-xs">
                      Phone Number
                    </Label>
                    <Input
                      id={`${subField.name}-input`}
                      aria-describedby={
                        subField.state.meta.errors.length > 0 ? `${subField.name}-error` : undefined
                      }
                      value={subField.state.value ?? ""}
                      onBlur={subField.handleBlur}
                      onChange={(e) => subField.handleChange(e.target.value)}
                      placeholder="+60123456789"
                    />
                    {subField.state.meta.errors.length > 0 && (
                      <p id={`${subField.name}-error`} className="text-xs text-destructive">
                        {subField.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>
          )}
        </div>
      )}
    </form.Field>
  );
}
