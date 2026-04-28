using NodaTime;

namespace TeleHealth.Api.Features.Schedules.CreateSchedule;

// Represents the input for creating a doctor schedule slot.
public sealed record CreateScheduleCommand(
    Guid DoctorPublicId,
    LocalDate Date,
    LocalTime StartTime,
    LocalTime EndTime,
    string ScheduleStatus
);
