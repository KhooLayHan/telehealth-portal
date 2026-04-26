using MassTransit;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Serilog;
using Slugify;
using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;
using TeleHealth.Contracts;

namespace TeleHealth.Api.Features.Appointments.Book;

public sealed class BookAppointmentHandler(
    ApplicationDbContext db,
    IPublishEndpoint publishEndpoint
)
{
    public async Task<BookAppointmentResult> HandleAsync(
        Guid userPublicId,
        BookAppointmentCommand cmd,
        CancellationToken ct
    )
    {
        Log.Information(
            "Patient {UserPublicId} attempting to book schedule {SchedulePublicId}.",
            userPublicId,
            cmd.SchedulePublicId
        );

        var bookedAppointmentStatus = await db.AppointmentStatuses.SingleAsync(
            s => s.Slug == "booked",
            ct
        );
        var availableScheduleStatus = await db.ScheduleStatuses.SingleAsync(
            s => s.Slug == "available",
            ct
        );
        var bookedScheduleStatus = await db.ScheduleStatuses.SingleAsync(
            s => s.Slug == "booked",
            ct
        );

        var patient = await db
            .Patients.Include(p => p.User)
            .FirstOrDefaultAsync(p => p.User.PublicId == userPublicId, ct);

        if (patient is null)
        {
            Log.Warning("Patient not found. PatientId: {PatientId}", userPublicId);
            throw new PatientNotFoundException();
        }

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        try
        {
            var schedule = await db
                .DoctorSchedules.Include(s => s.Doctor)
                .FirstOrDefaultAsync(s => s.PublicId == cmd.SchedulePublicId, ct);

            if (schedule is null)
            {
                await transaction.RollbackAsync(ct);
                throw new DoctorScheduleNotFoundException();
            }

            if (schedule.StatusId != availableScheduleStatus.Id)
            {
                await transaction.RollbackAsync(ct);
                throw new ScheduleSlotUnavailableException();
            }

            SlugHelper slugHelper = new();
            var publicId = Guid.NewGuid();

            var appointment = new Appointment
            {
                PublicId = publicId,
                Slug = slugHelper.GenerateSlug($"appt-{publicId:N}"[..24]),
                PatientId = patient.Id,
                DoctorId = schedule.DoctorId,
                ScheduleId = schedule.Id,
                StatusId = bookedAppointmentStatus.Id,
                CreatedByUserId = patient.User.Id,
                VisitReason = cmd.VisitReason,
                Symptoms = cmd.Symptoms,
            };

            schedule.StatusId = bookedScheduleStatus.Id;
            schedule.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

            db.Appointments.Add(appointment);

            await publishEndpoint.Publish(
                new AppointmentBookedEvent(
                    publicId,
                    patient.PublicId,
                    schedule.PublicId,
                    SystemClock.Instance.GetCurrentInstant(),
                    patient.User.Email
                ),
                ct
            );

            try
            {
                await db.SaveChangesAsync(ct);
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync(ct);
                throw new ScheduleSlotUnavailableException();
            }
            catch (DbUpdateException ex)
                when (ex.InnerException is PostgresException pg
                    && pg.SqlState == PostgresErrorCodes.UniqueViolation
                    && pg.ConstraintName == "uq_appointments_schedule_active"
                )
            {
                await transaction.RollbackAsync(ct);
                throw new ConcurrentBookingException();
            }

            await transaction.CommitAsync(ct);

            Log.Information(
                "Successfully booked Appointment {PublicId} for Patient {PatientPublicId}.",
                publicId,
                patient.PublicId
            );

            return new BookAppointmentResult(publicId);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}

public sealed record BookAppointmentResult(Guid AppointmentPublicId);
