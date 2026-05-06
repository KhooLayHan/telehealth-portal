using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Schedules;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Schedules.DeleteSchedule;

// Soft-deletes an available or blocked doctor schedule slot.
public sealed class DeleteScheduleHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(Guid schedulePublicId, CancellationToken ct)
    {
        var schedule = await db.DoctorSchedules.FirstOrDefaultAsync(
            s => s.PublicId == schedulePublicId,
            ct
        );

        if (schedule is null)
        {
            Log.Warning(
                "Schedule not found. SchedulePublicId: {SchedulePublicId}",
                schedulePublicId
            );
            throw new ScheduleNotFoundException();
        }

        var canDeleteSchedule =
            schedule.StatusId is StatusId.Schedule.Available or StatusId.Schedule.Blocked;

        if (!canDeleteSchedule)
        {
            Log.Warning(
                "Schedule delete blocked because schedule is not available or blocked. SchedulePublicId: {SchedulePublicId}",
                schedulePublicId
            );
            throw new CannotDeleteUnavailableScheduleException();
        }

        schedule.DeletedAt = SystemClock.Instance.GetCurrentInstant();

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Schedule soft-deleted. SchedulePublicId: {SchedulePublicId}",
            schedulePublicId
        );
    }
}
