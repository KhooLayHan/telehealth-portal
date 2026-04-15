import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Label } from "@/components/ui/label";

type TermsCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function TermsCheckbox({ checked, onCheckedChange }: TermsCheckboxProps) {
  return (
    <Field orientation="horizontal">
      <Checkbox
        checked={checked}
        id="accept-terms"
        onCheckedChange={(checkedState) => onCheckedChange(checkedState === true)}
      />
      <Label
        className="cursor-pointer select-none text-muted-foreground text-sm leading-snug"
        htmlFor="accept-terms"
      >
        I agree to the
        <Button
          className="cursor-pointer h-auto p-0 text-primary hover:underline"
          type="button"
          variant="link"
        >
          Terms of Service
        </Button>
        and
        <Button
          className="cursor-pointer h-auto p-0 text-primary hover:underline"
          type="button"
          variant="link"
        >
          Privacy Policy
        </Button>
      </Label>
    </Field>
  );
}
