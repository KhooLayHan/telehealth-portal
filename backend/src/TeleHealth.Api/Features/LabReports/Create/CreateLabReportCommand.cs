namespace TeleHealth.Api.Features.LabReports.Create;

public sealed record CreateLabReportCommand(
    long PatientId,
    long? ConsultationId,
    string ReportType,
    string FileName,
    string ContentType
) { }
