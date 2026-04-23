using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;

public sealed class UpdateAppointmentByReceptionistHandler(ApplicationDbContext db)
{
    public async Task HandleAsync(
        Guid appointmentPublicId,
        UpdateAppointmentByReceptionistCommand cmd,
        CancellationToken ct
    )
    {
        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var appointment = await db
                .Appointments.Include(a => a.DoctorSchedule)
                .Include(a => a.AppointmentStatus)
                .FirstOrDefaultAsync(a => a.PublicId == appointmentPublicId, ct);

            if (appointment is null)
            {
                Log.Warning(
                    "Appointment {AppointmentPublicId} not found for receptionist update.",
                    appointmentPublicId
                );
                throw new AppointmentNotFoundException();
            }

            var newStatus = await db.AppointmentStatuses.FirstOrDefaultAsync(
                s => s.Slug == cmd.StatusSlug,
                ct
            );

            if (newStatus is null)
            {
                Log.Warning("Appointment status slug '{StatusSlug}' not found.", cmd.StatusSlug);
                throw new AppointmentNotFoundException();
            }

            var oldSchedule = appointment.DoctorSchedule;
            var scheduleChanged = oldSchedule.PublicId != cmd.SchedulePublicId;

            if (scheduleChanged)
            {
                var newSchedule = await db.DoctorSchedules.FirstOrDefaultAsync(
                    s => s.PublicId == cmd.SchedulePublicId,
                    ct
                );

                if (newSchedule is null)
                {
                    Log.Warning("New schedule {SchedulePublicId} not found.", cmd.SchedulePublicId);
                    throw new DoctorScheduleNotFoundException();
                }

                if (newSchedule.StatusId != StatusId.Schedule.Available)
                    throw new ScheduleSlotUnavailableException();

                oldSchedule.StatusId = StatusId.Schedule.Available;
                newSchedule.StatusId = StatusId.Schedule.Booked;

                appointment.ScheduleId = newSchedule.Id;
                db.Entry(appointment).Property(nameof(Appointment.DoctorId)).CurrentValue =
                    newSchedule.DoctorId;
            }

            if (newStatus.Id == StatusId.Appointment.Cancelled)
            {
                appointment.CancellationReason = cmd.CancellationReason;

                if (!scheduleChanged)
                    oldSchedule.StatusId = StatusId.Schedule.Available;
            }

            if (newStatus.Id == StatusId.Appointment.CheckedIn)
                appointment.CheckInDateTime = SystemClock.Instance.GetCurrentInstant();

            appointment.StatusId = newStatus.Id;

            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            Log.Information(
                "Receptionist updated appointment {AppointmentPublicId} — status: {Status}",
                appointment.PublicId,
                newStatus.Name
            );
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(ct);
            throw new ScheduleSlotUnavailableException();
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}
