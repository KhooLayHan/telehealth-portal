import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UploadState } from "../types";

type UploadButtonProps = {
  uploadState: UploadState;
  onUpload: () => void;
  isUploading: boolean;
};

export function UploadButton({ uploadState, onUpload, isUploading }: UploadButtonProps) {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={onUpload}
      disabled={isUploading}
      aria-busy={isUploading}
    >
      {uploadState === "getting_link" && (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Securing connection...
        </>
      )}
      {uploadState === "uploading" && (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          Uploading to AWS S3...
        </>
      )}
      {uploadState === "idle" && "Upload to Patient Record"}
      {uploadState === "error" && "Retry upload"}
    </Button>
  );
}
