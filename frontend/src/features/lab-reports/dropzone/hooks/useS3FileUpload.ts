import { useCallback, useState } from "react";
import { useCreate } from "@/api/generated/lab-reports/lab-reports";
import { ACCEPTED_MIME, MAX_FILE_SIZE_BYTES } from "../constants";
import type { S3PdfDropzoneProps, UploadState, UseS3FileUploadResult } from "../types";

export function useS3FileUpload({
  patientPublicId,
  consultationPublicId,
  reportType,
  onUploadComplete,
}: S3PdfDropzoneProps): UseS3FileUploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createReportMutation = useCreate();

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

  const handleUpload = useCallback(async () => {
    if (!file) return;

    try {
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

      if (apiResponse.status !== 201) {
        throw new Error("Failed to initialize lab report record.");
      }

      const { publicId, uploadUrl } = apiResponse.data;

      if (!uploadUrl) {
        throw new Error("Failed to generate secure upload link.");
      }

      setUploadState("uploading");

      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed (HTTP ${s3Response.status}).`);
      }

      setUploadState("success");
      onUploadComplete(publicId);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during upload.";

      setUploadState("error");
      setErrorMessage(message);
    }
  }, [
    file,
    patientPublicId,
    consultationPublicId,
    reportType,
    onUploadComplete,
    createReportMutation,
  ]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setUploadState("idle");
    setErrorMessage(null);
  }, []);

  const isUploading = uploadState === "getting_link" || uploadState === "uploading";

  return {
    file,
    setFile,
    uploadState,
    errorMessage,
    isUploading,
    handleUpload,
    handleRemoveFile,
    validateAndSetFile,
  };
}
