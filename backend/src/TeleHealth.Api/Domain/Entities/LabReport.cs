using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class LabReport
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public long? ConsultationId { get; init; }
    public required long PatientId { get; init; }
    public required int StatusId { get; set; }
    public required string ReportType { get; set; }
    public string? S3ObjectKey { get; set; }
    public string? FileName { get; set; }
    public long? FileSizeBytes { get; set; }
    public List<Biomarker>? Biomarkers { get; set; }
    public Instant? UploadedAt { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public Consultation? Consultation { get; private set; } = null!;
    public Patient Patient { get; } = null!;
    public LabReportStatus LabReportStatus { get; } = null!;
}