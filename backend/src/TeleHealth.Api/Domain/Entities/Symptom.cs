namespace TeleHealth.Api.Domain.Entities;

public sealed class Symptom
{
    public string Name { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Duration { get; set; } = string.Empty;
}
