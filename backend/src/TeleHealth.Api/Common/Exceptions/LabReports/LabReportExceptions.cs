using TeleHealth.Api.Common.Exceptions.Base;
using TeleHealth.Api.Common.Exceptions.ErrorCodes;

namespace TeleHealth.Api.Common.Exceptions.LabReports;

public sealed class LabReportNotFoundException : NotFoundException
{
    public LabReportNotFoundException()
        : base(LabReportErrorCodes.NotFound, "Lab Report Not Found", $"Lab report was not found.")
    { }
}

public sealed class BiomarkerNotFoundException : NotFoundException
{
    public BiomarkerNotFoundException()
        : base(
            LabReportErrorCodes.BiomarkerNotFound,
            "Biomarker Not Found",
            "The requested biomarker was not found."
        ) { }
}

public sealed class DuplicateLabReportException : Base.ConflictException
{
    public DuplicateLabReportException()
        : base(
            LabReportErrorCodes.DuplicateReport,
            "Duplicate Lab Report",
            "A lab report of this type already exists for this patient."
        ) { }
}

public sealed class InvalidBiomarkerDataException : ValidationException
{
    public InvalidBiomarkerDataException(string biomarker, string reason)
        : base(
            LabReportErrorCodes.InvalidBiomarkerData,
            "Invalid Biomarker Data",
            "Invalid biomarker data was provided."
        ) { }
}

public sealed class InvalidPdfFormatException : ValidationException
{
    public InvalidPdfFormatException(string reason)
        : base(
            LabReportErrorCodes.InvalidPdfFormat,
            "Invalid PDF Format",
            "The uploaded PDF file format is invalid."
        ) { }
}
