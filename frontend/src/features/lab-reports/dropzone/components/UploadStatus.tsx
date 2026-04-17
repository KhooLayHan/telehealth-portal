import { CheckCircle } from "lucide-react";

export function UploadStatus() {
  return (
    <output
      aria-label="Upload complete"
      className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-500/50 bg-green-500/10 rounded-lg"
    >
      <CheckCircle className="size-10 text-green-500 mb-3" aria-hidden="true" />
      <p className="font-medium text-green-700 dark:text-green-400">Upload Complete!</p>
      <p className="text-sm text-green-600/80 mt-1">The lab report was securely saved to AWS S3.</p>
    </output>
  );
}
