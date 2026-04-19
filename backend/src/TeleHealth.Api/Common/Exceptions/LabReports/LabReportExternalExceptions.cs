using TeleHealth.Api.Common.Exceptions;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.LabReports;

public sealed class S3UploadFailedException : ProblemException
{
    public S3UploadFailedException(string? key = null, string? reason = null)
        : base(
            LabReportErrorCodes.S3UploadFailed,
            StatusCodes.Status502BadGateway,
            "S3 Upload Failed",
            "Failed to upload file to storage."
        )
    { }
}

public sealed class PdfProcessingFailedException : ProblemException
{
    public PdfProcessingFailedException(string fileName, string reason)
        : base(
            LabReportErrorCodes.PdfProcessingFailed,
            StatusCodes.Status422UnprocessableEntity,
            "PDF Processing Failed",
            "Failed to process the uploaded PDF file."
        )
    { }
}