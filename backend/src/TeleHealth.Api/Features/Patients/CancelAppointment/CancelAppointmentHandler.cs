using MassTransit;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.Patients.CancelAppointment;

public sealed class CancelAppointmentHandler(
    ApplicationDbContext db,
    IPublishEndpoint publishEndpoint
)
{
    public async Task HandleAsync(
        Guid userPublicId,
        string slug,
        CancelAppointmentCommand cmd,
        CancellationToken ct
    )
    {
        var appointment = await db
            .Appointments.Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.DoctorSchedule)
            .Include(a => a.AppointmentStatus)
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

        if (appointment.StatusId == StatusId.Appointment.InProgress)
        {
            Log.Warning(
                "User ID {UserPublicId} with Appointment Slug {Slug} was not found.",
                userPublicId,
                slug
            );
            throw new AppointmentInProgressException();
        }

        if (appointment.AppointmentStatus.IsTerminal)
        {
            Log.Warning("Appointment ID {AppointmentId} was terminated", appointment.PublicId);
            throw new AppointmentAlreadyTerminatedException(appointment.AppointmentStatus.Name);
        }

        appointment.StatusId = StatusId.Appointment.Cancelled;
        appointment.CancellationReason = cmd.CancellationReason;

        // Free up the Doctor's Schedule Slot
        var schedule = appointment.DoctorSchedule;
        schedule.StatusId = StatusId.Schedule.Available;

        var cancelledEvent = new AppointmentCancelledEvent(
            AppointmentPublicId: appointment.PublicId,
            PatientPublicId: appointment.Patient.PublicId,
            Reason: cmd.CancellationReason,
            OccurredAt: SystemClock.Instance.GetCurrentInstant()
        );

        await db.SaveChangesAsync(ct);
        await publishEndpoint.Publish(cancelledEvent, ct);

        Log.Information(
            "Cancelled Appointment {PublicId} for Patient {PatientId}. Schedule Slot {ScheduleId} is now Available.",
            appointment.PublicId,
            appointment.Patient.PublicId,
            schedule.PublicId
        );
    }
}
