using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

// Stores one weekly operating-hours row for the clinic settings record.
public sealed class SystemOperatingHour
{
    public long Id { get; init; }
    public long SystemSettingId { get; set; }
    public short DayOfWeek { get; set; }
    public bool IsOpen { get; set; }
    public LocalTime? OpenTime { get; set; }
    public LocalTime? CloseTime { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public SystemSetting SystemSetting { get; } = null!;
}
