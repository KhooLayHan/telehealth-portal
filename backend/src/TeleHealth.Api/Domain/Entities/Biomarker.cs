namespace TeleHealth.Api.Domain.Entities;

public sealed class Biomarker
{
    public required string Name { get; set; }
    public required string Value { get; set; }
    public required string Unit { get; set; }
    public required string ReferenceRange { get; set; }
    public required string Flag { get; set; }
}