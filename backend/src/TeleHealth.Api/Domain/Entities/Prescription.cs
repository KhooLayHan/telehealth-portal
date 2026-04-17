using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Prescription
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required long ConsultationId { get; init; }
    public required string MedicationName { get; set; }
    public required string Dosage { get; set; }
    public required string Frequency { get; set; }
    public required short DurationDays { get; set; }
    public required Instruction Instructions { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public Consultation Consultation { get; } = null!;
}
