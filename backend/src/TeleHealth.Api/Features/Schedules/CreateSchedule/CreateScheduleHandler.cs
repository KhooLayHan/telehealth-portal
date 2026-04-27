using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Common.Exceptions.Schedules;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Schedules.CreateSchedule;

// Handles creating a doctor schedule slot for admin and receptionist users.
public sealed class CreateScheduleHandler(ApplicationDbContext db)
{
    public async Task<ReceptionistDoctorScheduleSlotDto> HandleAsync(
        CreateScheduleCommand command,
        CancellationToken ct
    )
    {
        var doctor = await db
            .Doctors.Include(d => d.User)
            .FirstOrDefaultAsync(d => d.PublicId == command.DoctorPublicId, ct);

        if (doctor is null)
        {
            throw new ScheduleDoctorNotFoundException();
        }

        var statusSlug = command.ScheduleStatus.Trim().ToLowerInvariant();
        var scheduleStatus = await db
            .ScheduleStatuses.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Slug == statusSlug, ct);

        if (scheduleStatus is null)
        {
            throw new InvalidScheduleStatusTransitionException();
        }

        var overlapsExistingSlot = await db.DoctorSchedules.AnyAsync(
            s =>
                s.DoctorId == doctor.Id
                && s.Date == command.Date
                && s.StartTime < command.EndTime
                && command.StartTime < s.EndTime,
            ct
        );

        if (overlapsExistingSlot)
        {
            throw new OverlappingScheduleSlotException();
        }

        var schedule = new DoctorSchedule
        {
            DoctorId = doctor.Id,
            StatusId = scheduleStatus.Id,
            Date = command.Date,
            StartTime = command.StartTime,
            EndTime = command.EndTime,
            CreatedAt = SystemClock.Instance.GetCurrentInstant(),
        };

        db.DoctorSchedules.Add(schedule);
        await db.SaveChangesAsync(ct);

        return new ReceptionistDoctorScheduleSlotDto
        {
            PublicId = schedule.PublicId,
            Date = schedule.Date,
            StartTime = schedule.StartTime,
            EndTime = schedule.EndTime,
            ScheduleStatus = scheduleStatus.Name,
            ScheduleStatusColorCode = scheduleStatus.ColorCode,
            DoctorPublicId = doctor.PublicId,
            DoctorName = $"Dr. {doctor.User.FirstName} {doctor.User.LastName}",
            DoctorSpecialization = doctor.Specialization,
        };
    }
}
