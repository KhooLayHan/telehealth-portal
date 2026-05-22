using AdminAnalytics;
using NodaTime;

namespace TeleHealth.UnitTests;

public class AdminAnalyticsClinicActivityTests
{
    [Test]
    public async Task GetCurrentWeek_UsesClinicTimeZone()
    {
        var clock = new TestClock(Instant.FromUtc(2026, 5, 17, 16, 30));
        var clinicTimeZone = DateTimeZoneProviders.Tzdb["Asia/Kuala_Lumpur"];

        var week = Function.GetCurrentWeek(clock, clinicTimeZone);

        await Assert.That(week.Start).IsEqualTo(new LocalDate(2026, 5, 18));
        await Assert.That(week.End).IsEqualTo(new LocalDate(2026, 5, 24));
    }

    [Test]
    public async Task BuildWeekData_ReturnsSevenDaysWithZerosForMissingDates()
    {
        var week = new Function.WeekWindow(new LocalDate(2026, 5, 18), new LocalDate(2026, 5, 24));
        var appointmentCounts = new Dictionary<LocalDate, int>
        {
            [new(2026, 5, 19)] = 3,
            [new(2026, 5, 22)] = 7,
        };

        var data = Function.BuildWeekData(week, appointmentCounts);

        await Assert.That(data.Count).IsEqualTo(7);
        await Assert
            .That(string.Join(",", data.Select(point => point.Label)))
            .IsEqualTo("Mon,Tue,Wed,Thu,Fri,Sat,Sun");
        await Assert
            .That(string.Join(",", data.Select(point => point.Appointments)))
            .IsEqualTo("0,3,0,0,7,0,0");
    }

    private sealed class TestClock(Instant instant) : IClock
    {
        public Instant GetCurrentInstant()
        {
            return instant;
        }
    }
}
