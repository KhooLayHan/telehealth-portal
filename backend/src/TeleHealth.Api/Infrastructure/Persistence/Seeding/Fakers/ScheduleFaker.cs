using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Infrastructure.Persistence.Seeding.Fakers;

internal static class ScheduleFaker
{
    internal static List<DoctorSchedule> BuildDoctorSchedules(
        List<Doctor> doctors,
        LocalDate today,
        int availableStatusId
    )
    {
        var slots = new (LocalTime Start, LocalTime End)[]
        {
            (new LocalTime(8, 30), new LocalTime(9, 0)),
            (new LocalTime(9, 0), new LocalTime(9, 30)),
            (new LocalTime(9, 30), new LocalTime(10, 0)),
            (new LocalTime(10, 0), new LocalTime(10, 30)),
            (new LocalTime(10, 30), new LocalTime(11, 0)),
            (new LocalTime(11, 0), new LocalTime(11, 30)),
            (new LocalTime(14, 0), new LocalTime(14, 30)),
            (new LocalTime(14, 30), new LocalTime(15, 0)),
            (new LocalTime(15, 0), new LocalTime(15, 30)),
            (new LocalTime(15, 30), new LocalTime(16, 0)),
        };

        return
        [
            .. doctors.SelectMany(doctor =>
                // 3 past days + today + 5 future days
                Enumerable
                    .Range(-3, 9)
                    .SelectMany(offset =>
                        slots.Select(slot => new DoctorSchedule
                        {
                            PublicId = Guid.NewGuid(),
                            DoctorId = doctor.Id,
                            StatusId = availableStatusId,
                            Date = today.PlusDays(offset),
                            StartTime = slot.Start,
                            EndTime = slot.End,
                        })
                    )
            ),
        ];
    }
}
