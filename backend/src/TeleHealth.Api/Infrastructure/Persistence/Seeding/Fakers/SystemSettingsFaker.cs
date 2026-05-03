using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class SystemSettingFaker
{
    internal static List<SystemSetting> BuildSystemSettings()
    {
        var now = SystemClock.Instance.GetCurrentInstant();
        return
        [
            new SystemSetting
            {
                Slug = "telehealth",
                ClinicName = "TeleHealth",
                SupportEmail = "admin@telehealth.com",
                DefaultAppointmentDurationMinutes = 30,
                CreatedAt = now,
                OperatingHours =
                {
                    BuildHour(1, true, new LocalTime(9, 0), new LocalTime(18, 0), now),
                    BuildHour(2, true, new LocalTime(9, 0), new LocalTime(18, 0), now),
                    BuildHour(3, true, new LocalTime(9, 0), new LocalTime(18, 0), now),
                    BuildHour(4, true, new LocalTime(9, 0), new LocalTime(18, 0), now),
                    BuildHour(5, true, new LocalTime(9, 0), new LocalTime(18, 0), now),
                    BuildHour(6, false, null, null, now),
                    BuildHour(7, false, null, null, now),
                },
            },
            new SystemSetting
            {
                Slug = "clinic-settings",
                ClinicName = "TeleHealth Medical",
                SupportEmail = "admin04@telehealth.com",
                DefaultAppointmentDurationMinutes = 60,
                CreatedAt = now,
                OperatingHours =
                {
                    BuildHour(1, true, new LocalTime(9, 0), new LocalTime(17, 0), now),
                    BuildHour(2, true, new LocalTime(9, 0), new LocalTime(17, 0), now),
                    BuildHour(3, true, new LocalTime(9, 0), new LocalTime(17, 0), now),
                    BuildHour(4, true, new LocalTime(9, 0), new LocalTime(17, 0), now),
                    BuildHour(5, true, new LocalTime(9, 0), new LocalTime(17, 0), now),
                    BuildHour(6, false, null, null, now),
                    BuildHour(7, false, null, null, now),
                },
            },
        ];
    }

    private static SystemOperatingHour BuildHour(
        short dayOfWeek,
        bool isOpen,
        LocalTime? openTime,
        LocalTime? closeTime,
        Instant createdAt
    ) =>
        new()
        {
            DayOfWeek = dayOfWeek,
            IsOpen = isOpen,
            OpenTime = openTime,
            CloseTime = closeTime,
            CreatedAt = createdAt,
        };
}
