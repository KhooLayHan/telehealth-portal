using NodaTime;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Admins.GetSettings;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.UpdateSettings;

// Applies admin edits to the singleton clinic settings record.
public sealed class AdminUpdateSettingsHandler(
    ApplicationDbContext db,
    AdminGetSettingsHandler getSettingsHandler
)
{
    public async Task<AdminSettingsDto> HandleAsync(
        AdminUpdateSettingsCommand cmd,
        CancellationToken ct
    )
    {
        var settings = await getSettingsHandler.GetOrCreateSettingsAsync(ct);

        settings.ClinicName = cmd.ClinicName.Trim();
        settings.SupportEmail = cmd.SupportEmail.Trim();
        settings.DefaultAppointmentDurationMinutes = cmd.DefaultAppointmentDurationMinutes;
        settings.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

        var submittedHours = cmd.OperatingHours.ToDictionary(h => h.DayOfWeek);

        for (short day = 1; day <= 7; day++)
        {
            var submittedHour = submittedHours[day];
            var operatingHour =
                settings.OperatingHours.FirstOrDefault(h => h.DayOfWeek == day)
                ?? AddOperatingHour(settings, day);

            operatingHour.IsOpen = submittedHour.IsOpen;
            operatingHour.OpenTime = submittedHour.IsOpen ? submittedHour.OpenTime : null;
            operatingHour.CloseTime = submittedHour.IsOpen ? submittedHour.CloseTime : null;
            operatingHour.UpdatedAt = SystemClock.Instance.GetCurrentInstant();
        }

        await db.SaveChangesAsync(ct);
        return AdminSettingsDto.FromEntity(settings);
    }

    private static SystemOperatingHour AddOperatingHour(SystemSetting settings, short day)
    {
        var operatingHour = new SystemOperatingHour
        {
            DayOfWeek = day,
            IsOpen = false,
            OpenTime = null,
            CloseTime = null,
        };

        settings.OperatingHours.Add(operatingHour);
        return operatingHour;
    }
}
