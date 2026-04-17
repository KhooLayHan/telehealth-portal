export type UploadState = "idle" | "getting_link" | "uploading" | "success" | "error";

export type S3PdfDropzoneProps = {
  patientPublicId: string;
  consultationPublicId?: string | null;
  reportType: string;
  onUploadComplete: (labReportPublicId: string) => void;
};

export type UseS3FileUploadResult = {
  file: File | null;
  setFile: (file: File | null) => void;
  uploadState: UploadState;
  errorMessage: string | null;
  isUploading: boolean;
  handleUpload: () => Promise<void>;
  handleRemoveFile: () => void;
  validateAndSetFile: (candidate: File | null | undefined) => void;
};

export type FileValidationError = {
  message: string;
};
