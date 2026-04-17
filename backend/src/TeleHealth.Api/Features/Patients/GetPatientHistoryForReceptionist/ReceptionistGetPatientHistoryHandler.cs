using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetPatientHistoryForReceptionist;

public sealed class ReceptionistGetPatientHistoryHandler(ApplicationDbContext db)
{
    public async Task<ReceptionistPatientHistoryResponse?> HandleAsync(
        Guid patientPublicId,
        CancellationToken ct
    )
    {
        var patient = await db
            .Patients.AsNoTracking()
            .Where(p => p.PublicId == patientPublicId)
            .Select(p => new
            {
                p.Id,
                p.User.FirstName,
                p.User.LastName,
            })
            .FirstOrDefaultAsync(ct);

        if (patient is null)
            return null;

        var appointments = await db
            .Appointments.Include(a => a.DoctorSchedule)
            .Include(a => a.AppointmentStatus)
            .Include(a => a.Doctor)
            .ThenInclude(d => d.User)
            .Include(a => a.Consultation)
            .ThenInclude(c => c.Prescriptions)
            .Where(a => a.PatientId == patient.Id)
            .OrderByDescending(a => a.DoctorSchedule.Date)
            .ThenByDescending(a => a.DoctorSchedule.StartTime)
            .ToListAsync(ct);

        var items = appointments
            .Select(a =>
            {
                ConsultationSummaryDto? consultationDto = null;
                if (a.Consultation is { } c)
                {
                    consultationDto = new ConsultationSummaryDto
                    {
                        PublicId = c.PublicId,
                        Subjective = c.ConsultationNotes.Subjective,
                        Objective = c.ConsultationNotes.Objective,
                        Assessment = c.ConsultationNotes.Assessment,
                        Plan = c.ConsultationNotes.Plan,
                        FollowUpDate = c.FollowUpDate,
                        Prescriptions = c
                            .Prescriptions.Select(p => new PrescriptionSummaryDto
                            {
                                PublicId = p.PublicId,
                                MedicationName = p.MedicationName,
                                Dosage = p.Dosage,
                                Frequency = p.Frequency,
                                DurationDays = p.DurationDays,
                                TakeWith = p.Instructions.TakeWith,
                                Warnings = p.Instructions.Warnings,
                                Storage = p.Instructions.Storage,
                                MissedDose = p.Instructions.MissedDose,
                            })
                            .ToList(),
                    };
                }

                return new ReceptionistPatientAppointmentDto
                {
                    PublicId = a.PublicId,
                    Date = a.DoctorSchedule.Date,
                    StartTime = a.DoctorSchedule.StartTime,
                    EndTime = a.DoctorSchedule.EndTime,
                    VisitReason = a.VisitReason,
                    Status = a.AppointmentStatus.Name,
                    StatusColorCode = a.AppointmentStatus.ColorCode ?? string.Empty,
                    DoctorName = $"Dr. {a.Doctor.User.FirstName} {a.Doctor.User.LastName}",
                    DoctorSpecialization = a.Doctor.Specialization,
                    Symptoms = a.Symptoms,
                    Consultation = consultationDto,
                };
            })
            .ToList();

        return new ReceptionistPatientHistoryResponse
        {
            PatientName = $"{patient.FirstName} {patient.LastName}",
            Items = items,
        };
    }
}