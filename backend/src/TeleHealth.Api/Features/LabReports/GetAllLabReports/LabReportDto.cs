using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.LabReports.GetAllLabReports;

public sealed record LabReportStatusDto(string Slug, string Name, string? ColorCode);

public sealed record LabReportDto(
    Guid PublicId,
    string Slug,
    string ReportType,
    string? FileName,
    Guid PatientPublicId,
    string PatientFullName,
    Guid? ConsultationPublicId,
    LabReportStatusDto Status,
    Instant? UploadedAt,
    Instant CreatedAt
)
{
    public static LabReportDto FromEntity(LabReport r) =>
        new(
            r.PublicId,
            r.Slug,
            r.ReportType,
            r.FileName,
            r.Patient.PublicId,
            $"{r.Patient.User.FirstName} {r.Patient.User.LastName}",
            r.Consultation?.PublicId,
            new LabReportStatusDto(
                r.LabReportStatus.Slug,
                r.LabReportStatus.Name,
                r.LabReportStatus.ColorCode
            ),
            r.UploadedAt,
            r.CreatedAt
        );
}
