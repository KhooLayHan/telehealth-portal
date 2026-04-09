using Microsoft.EntityFrameworkCore;
using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class DoctorSchedule
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required long DoctorId { get; init; }
    public required int StatusId { get; set; }
    public required LocalDate Date { get; set; }
    public required LocalTime StartTime { get; set; }
    public required LocalTime EndTime { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public Doctor Doctor { get; } = null!;
    public ScheduleStatus ScheduleStatus { get; } = null!;
    public Appointment Appointment { get; } = null!;
}
