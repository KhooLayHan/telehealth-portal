using MassTransit;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.Patients.RescheduleAppointment;

public sealed class RescheduleAppointmentHandler(
    ApplicationDbContext db,
    IPublishEndpoint publishEndpoint
)
{
    public async Task HandleAsync(
        Guid userPublicId,
        string slug,
        RescheduleAppointmentCommand cmd,
        CancellationToken ct
    )
    {
        var appointment = await db
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.DoctorSchedule)
            .FirstOrDefaultAsync(
                a => a.Slug == slug && a.Patient.User.PublicId == userPublicId,
                ct
            );

        if (appointment is null)
        {
            Log.Warning(
                "User ID {UserPublicId} with Appointment Slug {Slug} was not found.",
                userPublicId,
                slug
            );
            throw new AppointmentNotFoundException();
        }

        if (appointment.StatusId != StatusId.Appointment.Booked)
            throw new InvalidRescheduleException();

        var oldSchedule = appointment.DoctorSchedule;

        var newSchedule = await db.DoctorSchedules.FirstOrDefaultAsync(
            s => s.PublicId == cmd.NewSchedulePublicId,
            ct
        );

        if (newSchedule is null)
        {
            Log.Warning(
                "New Schedule ID {NewSchedulePublicId} was not found.",
                cmd.NewSchedulePublicId
            );
            throw new DoctorScheduleNotFoundException();
        }

        if (newSchedule.StatusId != StatusId.Schedule.Available)
            throw new ScheduleSlotUnavailableException();

        oldSchedule.StatusId = StatusId.Schedule.Available;
        newSchedule.StatusId = StatusId.Schedule.Booked;
        appointment.ScheduleId = newSchedule.Id;

        var rescheduledEvent = new AppointmentRescheduledEvent(
            AppointmentPublicId: appointment.PublicId,
            PatientPublicId: appointment.Patient.PublicId,
            OldDate: oldSchedule.Date.ToString("yyyy-MM-dd", null),
            OldTime: oldSchedule.StartTime.ToString("HH:mm", null),
            NewDate: newSchedule.Date.ToString("yyyy-MM-dd", null),
            NewTime: newSchedule.StartTime.ToString("HH:mm", null),
            OccurredAt: SystemClock.Instance.GetCurrentInstant()
        );
        await publishEndpoint.Publish(rescheduledEvent, ct);

        await db.SaveChangesAsync(ct);

        Log.Information(
            "Rescheduled Appointment {PublicId} from {OldDate} {OldTime} to {NewDate} {NewTime}",
            appointment.PublicId,
            oldSchedule.Date,
            oldSchedule.StartTime,
            newSchedule.Date,
            newSchedule.StartTime
        );
    }
}
