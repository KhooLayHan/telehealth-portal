using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

// Stores singleton clinic-wide configuration shown and edited by admins.
public sealed class SystemSetting
{
    public long Id { get; init; }
    public required string Slug { get; init; }
    public required string ClinicName { get; set; }
    public required string SupportEmail { get; set; }
    public short DefaultAppointmentDurationMinutes { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public ICollection<SystemOperatingHour> OperatingHours { get; } = [];
}
