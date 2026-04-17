// src/features/lab-reports/components/S3PdfDropzone.tsx

import { CheckCircle, File, FileUp, Loader2, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { useCreate } from "@/api/generated/lab-reports/lab-reports";
import { Button } from "@/components/ui/button";

type S3PdfDropzoneProps = {
  patientId: number;
  consultationId?: number;
  reportType: string;
  onUploadComplete: (labReportPublicId: string) => void;
};

export function S3PdfDropzone({
  patientId,
  consultationId,
  reportType,
  onUploadComplete,
}: S3PdfDropzoneProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<
    "idle" | "getting_link" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createReportMutation = useCreate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadState("idle");
      setErrorMessage(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
  });

  const handleUpload = async () => {
    if (!file) return;

    try {
      // 1. Get the S3 Pre-Signed URL from ASP.NET
      setUploadState("getting_link");
      const apiResponse = await createReportMutation.mutateAsync({
        data: {
          patientId,
          consultationId,
          reportType,
          fileName: file.name,
          contentType: file.type,
        },
      });

      // Safely handle the response shape (assuming it returns an object with data)
      const { labReportId, uploadUrl } = apiResponse.data || (apiResponse as any);

      if (!uploadUrl) throw new Error("Failed to generate secure upload link.");

      // 2. Upload the file directly to AWS S3 using native fetch!
      setUploadState("uploading");

      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!s3Response.ok) throw new Error("Failed to upload file to Amazon S3.");

      // 3. Success!
      setUploadState("success");
      onUploadComplete(labReportId);
    } catch (err: any) {
      console.error(err);
      setUploadState("error");
      setErrorMessage(err.message || "An unexpected error occurred during upload.");
    }
  };

  if (uploadState === "success") {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-500/50 bg-green-500/10 rounded-lg">
        <CheckCircle className="size-10 text-green-500 mb-3" />
        <p className="font-medium text-green-700 dark:text-green-400">Upload Complete!</p>
        <p className="text-sm text-green-600/80 mt-1">
          The lab report was securely saved to AWS S3.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          }`}
        >
          <input {...getInputProps()} />
          <FileUp className="size-10 text-muted-foreground mb-4" />
          <p className="font-medium text-sm">Drag & drop a PDF report here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse files (Max 10MB)</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <File className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploadState === "idle" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setFile(null)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState === "error" && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Action Button */}
      {file && (
        <Button
          className="w-full"
          onClick={handleUpload}
          disabled={uploadState === "getting_link" || uploadState === "uploading"}
        >
          {uploadState === "getting_link" && (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Securing Connection...
            </>
          )}
          {uploadState === "uploading" && (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" /> Uploading to AWS S3...
            </>
          )}
          {uploadState === "idle" && "Upload to Patient Record"}
        </Button>
      )}
    </div>
  );
}
