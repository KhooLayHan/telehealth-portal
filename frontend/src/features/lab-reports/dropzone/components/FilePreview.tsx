import { File, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FilePreviewProps = {
  file: File;
  isUploading: boolean;
  onRemove: () => void;
};

export function FilePreview({ file, isUploading, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-2 bg-primary/10 text-primary rounded-md" aria-hidden="true">
          <File className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>

      {!isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Remove ${file.name}`}
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}
