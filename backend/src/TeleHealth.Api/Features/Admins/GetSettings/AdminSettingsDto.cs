using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.GetSettings;

// Response DTO for clinic-wide settings managed by admins.
public sealed record AdminSettingsDto(
    string Slug,
    string ClinicName,
    string SupportEmail,
    short DefaultAppointmentDurationMinutes,
    IReadOnlyList<AdminOperatingHourDto> OperatingHours
)
{
    public static AdminSettingsDto FromEntity(SystemSetting setting) =>
        new(
            setting.Slug,
            setting.ClinicName,
            setting.SupportEmail,
            setting.DefaultAppointmentDurationMinutes,
            setting
                .OperatingHours.OrderBy(h => h.DayOfWeek)
                .Select(h => new AdminOperatingHourDto(
                    h.DayOfWeek,
                    h.IsOpen,
                    h.OpenTime,
                    h.CloseTime
                ))
                .ToList()
        );
}
