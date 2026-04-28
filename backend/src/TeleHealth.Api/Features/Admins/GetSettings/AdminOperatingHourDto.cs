using NodaTime;

namespace TeleHealth.Api.Features.Admins.GetSettings;

// Response DTO for one clinic operating-hours row.
public sealed record AdminOperatingHourDto(
    short DayOfWeek,
    bool IsOpen,
    LocalTime? OpenTime,
    LocalTime? CloseTime
);
