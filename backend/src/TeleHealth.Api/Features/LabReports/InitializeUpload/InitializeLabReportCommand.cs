namespace TeleHealth.Api.Features.LabReports.InitializeUpload;

public sealed record InitializeLabReportCommand(
    Guid PatientPublicId,
    Guid? ConsultationPublicId,
    string ReportType,
    string FileName,
    string ContentType
);