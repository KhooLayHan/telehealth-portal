using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Appointment
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required long PatientId { get; init; }
    public required long DoctorId { get; init; }
    public required long ScheduleId { get; init; }
    public required int StatusId { get; init; }
    public required long CreatedByUserId { get; init; }
    public required string VisitReason { get; set; }
    public List<Symptom>? Symptoms { get; set; }
    public Instant? CheckInDateTime { get; set; }
    public string? CancellationReason { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public Patient Patient { get; } = null!;
    public Doctor Doctor { get; } = null!;
    public DoctorSchedule DoctorSchedule { get; } = null!;
    public AppointmentStatus AppointmentStatus { get; } = null!;
    public User User { get; } = null!;
    public Consultation Consultation { get; } = null!;
}
