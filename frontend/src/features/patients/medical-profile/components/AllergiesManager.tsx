import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateId } from "../helpers";
import { type AllergiesManagerProps, SEVERITY_OPTIONS, type Severity } from "../types";

export function AllergiesManager({ form }: AllergiesManagerProps) {
  return (
    <form.Field name="allergies">
      {(field) => (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Allergies</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                field.pushValue({
                  id: generateId(),
                  allergen: "",
                  severity: "mild",
                  reaction: "",
                })
              }
            >
              <Plus className="mr-1 size-3" /> Add Allergy
            </Button>
          </div>

          <div className="space-y-3">
            {field.state.value.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No allergies recorded.</p>
            ) : (
              field.state.value.map((allergy, i) => (
                // Keyed by stable UUID — survives removal of earlier items
                <div
                  key={allergy.id}
                  className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                >
                  <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <form.Field name={`allergies[${i}].allergen`}>
                      {(subField) => (
                        <div className="space-y-1">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Allergen
                          </Label>
                          <Input
                            id={`${subField.name}-input`}
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Peanuts"
                          />
                          {subField.state.meta.errors.length > 0 && (
                            <p id={`${subField.name}-error`} className="text-xs text-destructive">
                              {subField.state.meta.errors[0]?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    <form.Field name={`allergies[${i}].severity`}>
                      {(subField) => (
                        <div className="space-y-1">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Severity
                          </Label>
                          <select
                            id={`${subField.name}-input`}
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value as Severity)}
                            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          >
                            {SEVERITY_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          {subField.state.meta.errors.length > 0 && (
                            <p id={`${subField.name}-error`} className="text-xs text-destructive">
                              {subField.state.meta.errors[0]?.message}
                            </p>
                          )}
                        </div>
                      )}
                    </form.Field>
                    <form.Field name={`allergies[${i}].reaction`}>
                      {(subField) => (
                        <div className="space-y-1">
                          <Label htmlFor={`${subField.name}-input`} className="text-xs">
                            Reaction
                          </Label>
                          <Input
                            id={`${subField.name}-input`}
                            aria-describedby={
                              subField.state.meta.errors.length > 0
                                ? `${subField.name}-error`
                                : undefined
                            }
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Hives, difficulty breathing"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove allergy ${i + 1}`}
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => field.removeValue(i)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </form.Field>
  );
}
