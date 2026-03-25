namespace TeleHealth.Api.Domain.Entities;

public sealed record Biomarker(string Name, string Value, string Unit, string ReferenceRange, string Flag)
{
}
