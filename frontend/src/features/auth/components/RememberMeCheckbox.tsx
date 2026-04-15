import { useId } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

type RememberMeCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function RememberMeCheckbox({ checked, onCheckedChange }: RememberMeCheckboxProps) {
  const id = useId();

  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={checked}
        id={id}
        onCheckedChange={(checkedState) => onCheckedChange(checkedState === true)}
      />
      <Label
        className="cursor-pointer select-none text-muted-foreground text-sm font-medium"
        htmlFor={id}
      >
        Remember me for 30 days
      </Label>
    </Field>
  );
}
