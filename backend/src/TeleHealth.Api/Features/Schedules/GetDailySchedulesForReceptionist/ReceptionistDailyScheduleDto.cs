using NodaTime;

namespace TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;

public sealed record ReceptionistDoctorScheduleSlotDto
{
    public Guid PublicId { get; init; }
    public LocalDate Date { get; init; }
    public LocalTime StartTime { get; init; }
    public LocalTime EndTime { get; init; }
    public string ScheduleStatus { get; init; } = string.Empty;
    public string? ScheduleStatusColorCode { get; init; }
    public Guid DoctorPublicId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string DoctorSpecialization { get; init; } = string.Empty;

    // Populated when the slot is booked
    public Guid? AppointmentPublicId { get; init; }
    public string? PatientName { get; init; }
    public string? VisitReason { get; init; }
    public string? AppointmentStatus { get; init; }
    public string? AppointmentStatusColorCode { get; init; }
}