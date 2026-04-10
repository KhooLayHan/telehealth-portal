namespace TeleHealth.Api.Common.Exceptions.ErrorCodes;

public static class LabReportErrorCodes
{
    public const string NotFound = "LabReport.NotFound";
    public const string BiomarkerNotFound = "LabReport.BiomarkerNotFound";
    public const string DuplicateReport = "LabReport.DuplicateReport";
    public const string InvalidBiomarkerData = "LabReport.InvalidBiomarkerData";
    public const string InvalidPdfFormat = "LabReport.InvalidPdfFormat";
    public const string S3UploadFailed = "LabReport.S3UploadFailed";
    public const string PdfProcessingFailed = "LabReport.PdfProcessingFailed";
}
