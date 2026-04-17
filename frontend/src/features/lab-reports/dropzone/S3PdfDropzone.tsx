import { useCallback, useState } from "react";
import { ErrorAlert } from "./components/ErrorAlert";
import { FileDropZone } from "./components/FileDropZone";
import { FilePreview } from "./components/FilePreview";
import { UploadButton } from "./components/UploadButton";
import { UploadStatus } from "./components/UploadStatus";
import { useS3FileUpload } from "./hooks/useS3FileUpload";
import type { S3PdfDropzoneProps } from "./types";

export type { S3PdfDropzoneProps } from "./types";

export function S3PdfDropzone(props: S3PdfDropzoneProps) {
  const {
    file,
    uploadState,
    errorMessage,
    isUploading,
    handleUpload,
    handleRemoveFile,
    validateAndSetFile,
  } = useS3FileUpload(props);

  const [isDragActive, setIsDragActive] = useState(false);

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

  if (uploadState === "success") {
    return <UploadStatus />;
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropZone
          isDragActive={isDragActive}
          isUploading={isUploading}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={validateAndSetFile}
        />
      ) : (
        <FilePreview file={file} isUploading={isUploading} onRemove={handleRemoveFile} />
      )}

      {uploadState === "error" && errorMessage && <ErrorAlert message={errorMessage} />}

      {file && (
        <UploadButton uploadState={uploadState} onUpload={handleUpload} isUploading={isUploading} />
      )}
    </div>
  );
}
