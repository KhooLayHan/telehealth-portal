using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Consultation
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required long AppointmentId { get; init; }
    public required ConsultationNote ConsultationNotes { get; set; }
    public LocalDate? FollowUpDate { get; set; }
    public required Instant ConsultationDateTime { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public Appointment Appointment { get; } = null!;
    public ICollection<Prescription> Prescriptions { get; } = [];
    public ICollection<LabReport> LabReports { get; } = [];
}
