namespace TeleHealth.Api.Domain.Entities;

public sealed record Allergy(string Allergen, string Severity, string Reaction)
{
}
