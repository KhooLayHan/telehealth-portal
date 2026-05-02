using NodaTime;

namespace TeleHealth.Api.Features.Admins.UpdateSettings;

// Represents one operating-hours row submitted with admin settings updates.
public sealed record AdminUpdateOperatingHourCommand(
    short DayOfWeek,
    bool IsOpen,
    LocalTime? OpenTime,
    LocalTime? CloseTime
);
