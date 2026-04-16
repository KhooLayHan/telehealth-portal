import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type PasswordInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  "aria-invalid"?: boolean;
};

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  "aria-invalid": ariaInvalid,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          aria-invalid={ariaInvalid}
          className="pr-10"
          id={id}
          name={name}
          onBlur={onBlur}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={showPassword ? "text" : "password"}
          value={value}
        />
        <Button
          aria-label={showPassword ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 p-0"
          onClick={() => setShowPassword((v) => !v)}
          size="icon"
          type="button"
          variant="ghost"
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
      <FieldError>{error && <p className="text-destructive text-xs">{error}</p>}</FieldError>
    </div>
  );
}
