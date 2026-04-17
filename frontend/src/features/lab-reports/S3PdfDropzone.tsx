import { CheckCircle, File, FileUp, Loader2, X } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";

import { useCreate } from "@/api/generated/lab-reports/lab-reports";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "getting_link" | "uploading" | "success" | "error";

type S3PdfDropzoneProps = {
  patientPublicId: string;
  consultationPublicId?: string | null;
  reportType: string;
  onUploadComplete: (labReportPublicId: string) => void;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_MIME = "application/pdf";

export function S3PdfDropzone({
  patientPublicId,
  consultationPublicId,
  reportType,
  onUploadComplete,
}: S3PdfDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const createReportMutation = useCreate();

  // ─── File validation ────────────────────────────────────────────────────────

  const validateAndSetFile = useCallback((candidate: File | null | undefined) => {
    if (!candidate) return;

    if (candidate.type !== ACCEPTED_MIME) {
      setUploadState("error");
      setErrorMessage("Only PDF files are accepted.");
      return;
    }

    if (candidate.size > MAX_FILE_SIZE_BYTES) {
      setUploadState("error");
      setErrorMessage("File exceeds the 10 MB limit.");
      return;
    }

    setFile(candidate);
    setUploadState("idle");
    setErrorMessage(null);
  }, []);

  // ─── Native drag-and-drop handlers ──────────────────────────────────────────

  const handleDragOver = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      validateAndSetFile(e.dataTransfer.files[0]);
    },
    [validateAndSetFile],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndSetFile(e.target.files?.[0]);
      // Reset so the same file can be re-selected after removal
      e.target.value = "";
    },
    [validateAndSetFile],
  );

  // Allow keyboard activation of the drop zone (Enter / Space)
  const handleDropZoneKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  // ─── Upload flow ─────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;

    try {
      // 1. Request a pre-signed S3 URL from the API
      setUploadState("getting_link");

      const apiResponse = await createReportMutation.mutateAsync({
        data: {
          patientPublicId,
          consultationPublicId: consultationPublicId ?? null,
          reportType,
          fileName: file.name,
          contentType: file.type,
        },
      });

      // FIX: Narrow by status code instead of casting to `any`
      if (apiResponse.status !== 201) {
        throw new Error("Failed to initialize lab report record.");
      }

      const { publicId, uploadUrl } = apiResponse.data;

      if (!uploadUrl) {
        throw new Error("Failed to generate secure upload link.");
      }

      // 2. Stream the file directly to S3 — never touches our server
      setUploadState("uploading");

      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed (HTTP ${s3Response.status}).`);
      }

      // 3. Notify parent and show success state
      setUploadState("success");
      onUploadComplete(publicId);
    } catch (err: unknown) {
      // FIX: use `unknown` and narrow via instanceof instead of `any`
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during upload.";

      setUploadState("error");
      setErrorMessage(message);
    }
  };

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setUploadState("idle");
    setErrorMessage(null);
  }, []);

  const isUploading = uploadState === "getting_link" || uploadState === "uploading";

  // ─── Success state ────────────────────────────────────────────────────────────

  if (uploadState === "success") {
    return (
      <output
        aria-label="Upload complete"
        className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-500/50 bg-green-500/10 rounded-lg"
      >
        <CheckCircle className="size-10 text-green-500 mb-3" aria-hidden="true" />
        <p className="font-medium text-green-700 dark:text-green-400">Upload Complete!</p>
        <p className="text-sm text-green-600/80 mt-1">
          The lab report was securely saved to AWS S3.
        </p>
      </output>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Hidden native file input — triggered by the drop zone or the label */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_MIME}
        className="sr-only"
        aria-label="Select a PDF lab report to upload"
        onChange={handleFileInputChange}
      />

      {/* Drag-and-drop zone */}
      {!file ? (
        <button
          type="button"
          tabIndex={0}
          aria-label="Drop a PDF here or press Enter to browse files"
          aria-disabled={isUploading}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={handleDropZoneKeyDown}
          className={[
            "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors select-none",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50",
          ].join(" ")}
        >
          <FileUp className="size-10 text-muted-foreground mb-4" aria-hidden="true" />
          <p className="font-medium text-sm">Drag &amp; drop a PDF report here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse files (Max 10 MB)</p>
        </button>
      ) : (
        /* Selected file preview */
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 text-primary rounded-md" aria-hidden="true">
              <File className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          {!isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${file.name}`}
              onClick={handleRemoveFile}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}

      {/* Error message */}
      {uploadState === "error" && errorMessage && (
        <p
          role="alert"
          className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md"
        >
          {errorMessage}
        </p>
      )}

      {/* Upload button */}
      {file && (
        <Button
          type="button"
          className="w-full"
          onClick={handleUpload}
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
      )}
    </div>
  );
}
