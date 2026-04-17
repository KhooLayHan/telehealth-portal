import { FileUp } from "lucide-react";
import { useCallback, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ACCEPTED_MIME } from "../constants";

type FileDropZoneProps = {
  isDragActive: boolean;
  isUploading: boolean;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
  onFileSelect: (file: File | null | undefined) => void;
};

export function FileDropZone({
  isDragActive,
  isUploading,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: FileDropZoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect(e.target.files?.[0]);
      e.target.value = "";
    },
    [onFileSelect],
  );

  return (
    <Field>
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_MIME}
        className="sr-only"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        aria-label="Drop a PDF here or press Enter to browse files"
        aria-disabled={isUploading}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        className={[
          "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors select-none w-full h-auto",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        ].join(" ")}
      >
        <FileUp className="size-10 text-muted-foreground mb-4" aria-hidden="true" />
        <FieldLabel className="font-medium text-sm">Drag & drop a PDF report here</FieldLabel>
        <FieldDescription className="text-xs text-muted-foreground mt-1">
          or click to browse files (Max 10 MB)
        </FieldDescription>
      </Button>
    </Field>
  );
}
