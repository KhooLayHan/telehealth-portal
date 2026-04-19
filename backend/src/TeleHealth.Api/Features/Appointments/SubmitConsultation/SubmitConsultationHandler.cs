using Microsoft.EntityFrameworkCore;

using NodaTime;

using Slugify;

using TeleHealth.Api.Common.Exceptions.Appointments;
using TeleHealth.Api.Common.Exceptions.Consultations;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.SubmitConsultation;

public sealed class SubmitConsultationHandler(ApplicationDbContext db)
{
    public async Task<Guid> HandleAsync(
        Guid appointmentPublicId,
        Guid doctorPublicId,
        SubmitConsultationRequest req,
        CancellationToken ct
    )
    {
        var appointment = await db
            .Appointments.Include(a => a.AppointmentStatus)
            .FirstOrDefaultAsync(
                a => a.PublicId == appointmentPublicId && a.Doctor.User.PublicId == doctorPublicId,
                ct
            );

        if (appointment is null)
            throw new AppointmentNotFoundException();

        if (appointment.AppointmentStatus.Name != "Booked")
            throw new AppointmentAlreadyTerminatedException(appointment.AppointmentStatus.Name);

        var alreadyExists = await db.Consultations.AnyAsync(
            c => c.AppointmentId == appointment.Id,
            ct
        );
        if (alreadyExists)
            throw new ConsultationAlreadyExistsException(appointmentPublicId.ToString());

        var completedStatus = await db.AppointmentStatuses.SingleAsync(
            s => s.Slug == "completed",
            ct
        );

        await using var transaction = await db.Database.BeginTransactionAsync(ct);

        try
        {
            SlugHelper slugHelper = new();
            var consultationPublicId = Guid.NewGuid();

            var consultation = new Consultation
            {
                PublicId = consultationPublicId,
                Slug = slugHelper.GenerateSlug($"cons-{consultationPublicId:N}"[..24]),
                AppointmentId = appointment.Id,
                ConsultationNotes = new ConsultationNote(
                    req.Subjective,
                    req.Objective,
                    req.Assessment,
                    req.Plan
                ),
                FollowUpDate = req.FollowUpDate,
                ConsultationDateTime = SystemClock.Instance.GetCurrentInstant(),
            };

            db.Consultations.Add(consultation);
            await db.SaveChangesAsync(ct);

            foreach (var p in req.Prescriptions)
            {
                db.Prescriptions.Add(
                    new Prescription
                    {
                        ConsultationId = consultation.Id,
                        MedicationName = p.MedicationName,
                        Dosage = p.Dosage,
                        Frequency = p.Frequency,
                        DurationDays = p.DurationDays,
                        Instructions = new Instruction(
                            p.Instructions.TakeWith,
                            p.Instructions.Warnings,
                            p.Instructions.Storage,
                            p.Instructions.MissedDose
                        ),
                    }
                );
            }

            appointment.StatusId = completedStatus.Id;
            appointment.UpdatedAt = SystemClock.Instance.GetCurrentInstant();

            await db.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);

            return consultationPublicId;
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw;
        }
    }
}