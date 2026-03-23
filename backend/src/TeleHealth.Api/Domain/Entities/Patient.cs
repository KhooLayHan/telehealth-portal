using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Patient
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required long UserId { get; init; }
    public string? BloodGroup { get; set; }
    public List<Allergies>? Allergies { get; set; } = [];
    public EmergencyContact? EmergencyContact { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public User User { get; private set;  } = null!;
}
