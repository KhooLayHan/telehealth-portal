import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateId } from "../helpers";
import { type AllergiesManagerProps, SEVERITY_OPTIONS, type Severity } from "../types";
import { FormField } from "./FormField";

export function AllergiesManager({ form }: AllergiesManagerProps) {
  return (
    <form.Field name="allergies">
      {(field) => (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Allergies</h3>
            <Button
              className="cursor-pointer"
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
                <div
                  key={allergy.id}
                  className="flex items-start gap-2 bg-muted/30 p-3 rounded-lg border border-border"
                >
                  <div className="grid flex-1 gap-3 sm:grid-cols-3">
                    <form.Field name={`allergies[${i}].allergen`}>
                      {(subField) => (
                        <FormField
                          label={<span className="text-xs">Allergen</span>}
                          htmlFor={`${subField.name}-input`}
                          error={subField.state.meta.errors[0]?.message}
                        >
                          <Input
                            id={`${subField.name}-input`}
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Peanuts"
                          />
                        </FormField>
                      )}
                    </form.Field>
                    <form.Field name={`allergies[${i}].severity`}>
                      {(subField) => (
                        <FormField
                          label={<span className="text-xs">Severity</span>}
                          htmlFor={`${subField.name}-input`}
                          error={subField.state.meta.errors[0]?.message}
                        >
                          <Select
                            value={subField.state.value}
                            onValueChange={(value) => subField.handleChange(value as Severity)}
                          >
                            <SelectTrigger id={`${subField.name}-input`} className="w-full">
                              <SelectValue>
                                {(() => {
                                  const selectedSeverity = SEVERITY_OPTIONS.find(
                                    (s) => s === subField.state.value,
                                  );
                                  if (selectedSeverity) {
                                    return (
                                      selectedSeverity.charAt(0).toUpperCase() +
                                      selectedSeverity.slice(1)
                                    );
                                  }
                                  return "Select severity";
                                })()}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {SEVERITY_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.charAt(0).toUpperCase() + s.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      )}
                    </form.Field>
                    <form.Field name={`allergies[${i}].reaction`}>
                      {(subField) => (
                        <FormField
                          label={<span className="text-xs">Reaction</span>}
                          htmlFor={`${subField.name}-input`}
                          error={subField.state.meta.errors[0]?.message}
                        >
                          <Input
                            id={`${subField.name}-input`}
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) => subField.handleChange(e.target.value)}
                            placeholder="Hives, difficulty breathing"
                          />
                        </FormField>
                      )}
                    </form.Field>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove allergy ${i + 1}`}
                    className="text-destructive hover:bg-destructive/10 cursor-pointer"
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
