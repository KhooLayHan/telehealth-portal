using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class LabReportStatus
{
    public int Id { get; init; }
    public required string Slug { get; init; }
    public required string Name { get; set; }
    public string? ColorCode { get; set; }
    public string? Description { get; set; }
    public Instant CreatedAt { get; set; }
    public ICollection<LabReport> LabReports { get; } = [];
}