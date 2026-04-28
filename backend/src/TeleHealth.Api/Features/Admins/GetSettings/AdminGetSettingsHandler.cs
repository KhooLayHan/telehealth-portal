using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetSettings;

// Queries the singleton clinic settings record for admin settings screens.
public sealed class AdminGetSettingsHandler(ApplicationDbContext db)
{
    public const string SettingsSlug = "clinic-settings";

    public async Task<AdminSettingsDto> HandleAsync(CancellationToken ct)
    {
        var settings = await GetOrCreateSettingsAsync(ct);
        return AdminSettingsDto.FromEntity(settings);
    }

    public async Task<SystemSetting> GetOrCreateSettingsAsync(CancellationToken ct)
    {
        var settings = await db
            .SystemSettings.Include(s => s.OperatingHours)
            .FirstOrDefaultAsync(s => s.Slug == SettingsSlug, ct);

        if (settings is not null)
        {
            return settings;
        }

        settings = new SystemSetting
        {
            Slug = SettingsSlug,
            ClinicName = "TeleHealth Medical Centre",
            SupportEmail = "support@telehealth.com",
            DefaultAppointmentDurationMinutes = 30,
        };

        foreach (var hour in BuildDefaultOperatingHours())
        {
            settings.OperatingHours.Add(hour);
        }

        db.SystemSettings.Add(settings);
        await db.SaveChangesAsync(ct);
        return settings;
    }

    private static IReadOnlyList<SystemOperatingHour> BuildDefaultOperatingHours() =>
        [
            new()
            {
                DayOfWeek = 1,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(17, 0),
            },
            new()
            {
                DayOfWeek = 2,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(17, 0),
            },
            new()
            {
                DayOfWeek = 3,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(17, 0),
            },
            new()
            {
                DayOfWeek = 4,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(17, 0),
            },
            new()
            {
                DayOfWeek = 5,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(17, 0),
            },
            new()
            {
                DayOfWeek = 6,
                IsOpen = true,
                OpenTime = new LocalTime(9, 0),
                CloseTime = new LocalTime(13, 0),
            },
            new()
            {
                DayOfWeek = 7,
                IsOpen = false,
                OpenTime = null,
                CloseTime = null,
            },
        ];
}
