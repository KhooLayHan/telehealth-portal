namespace TeleHealth.Api.Domain.Entities;

public sealed class Allergies
{
    public required string Allergen { get; set; }
    public required string Severity { get; set; }
    public required string Reaction { get; set; }
}
