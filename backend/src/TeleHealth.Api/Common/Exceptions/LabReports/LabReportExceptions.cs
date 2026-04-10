using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.LabReports;

public sealed class LabReportNotFoundException : NotFoundException
{
    public LabReportNotFoundException(string reportId)
        : base(
            LabReportErrorCodes.NotFound,
            "Lab Report Not Found",
            "The requested lab report was not found.",
            $"Lab report {reportId} not found"
        ) { }
}

public sealed class BiomarkerNotFoundException : NotFoundException
{
    public BiomarkerNotFoundException(string biomarkerName)
        : base(
            LabReportErrorCodes.BiomarkerNotFound,
            "Biomarker Not Found",
            "The requested biomarker was not found.",
            $"Biomarker '{biomarkerName}' not found in report"
        ) { }
}

public sealed class DuplicateLabReportException : Base.ConflictException
{
    public DuplicateLabReportException(string reportType, string patientId)
        : base(
            LabReportErrorCodes.DuplicateReport,
            "Duplicate Lab Report",
            "A lab report of this type already exists for this patient.",
            $"Duplicate {reportType} report for patient {patientId}"
        ) { }
}

public sealed class InvalidBiomarkerDataException : ValidationException
{
    public InvalidBiomarkerDataException(string biomarker, string reason)
        : base(
            LabReportErrorCodes.InvalidBiomarkerData,
            "Invalid Biomarker Data",
            $"Invalid data for biomarker '{biomarker}'.",
            reason
        ) { }
}

public sealed class InvalidPdfFormatException : ValidationException
{
    public InvalidPdfFormatException(string reason)
        : base(
            LabReportErrorCodes.InvalidPdfFormat,
            "Invalid PDF Format",
            "The uploaded PDF file format is invalid.",
            reason
        ) { }
}
