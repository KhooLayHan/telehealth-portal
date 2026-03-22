namespace TeleHealth.Api.Domain.Entities;

public sealed class EmergencyContact
{
    public required string Name { get; set; }
    public required string Relationship { get; set; }
    public required string Phone { get; set; }
}
