using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;

public sealed class GetDoctorPatientAppointmentsHandler(ApplicationDbContext db)
{
    public async Task<GetDoctorPatientAppointmentsResponse?> HandleAsync(
        Guid userPublicId,
        Guid patientPublicId,
        CancellationToken ct
    )
    {
        var doctor = await db
            .Doctors.AsNoTracking()
            .Where(d => d.User.PublicId == userPublicId)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        if (doctor is null)
            return null;

        var doctorId = doctor.Id;

        var patient = await db
            .Patients.AsNoTracking()
            .Where(p =>
                p.PublicId == patientPublicId && p.Appointments.Any(a => a.DoctorId == doctorId)
            )
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
            .Appointments.AsNoTracking()
            .Include(a => a.DoctorSchedule)
            .Include(a => a.AppointmentStatus)
            .Include(a => a.Consultation)
                .ThenInclude(c => c.Prescriptions)
            .Where(a => a.DoctorId == doctorId && a.PatientId == patient.Id)
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

                return new DoctorPatientAppointmentDto
                {
                    PublicId = a.PublicId,
                    Date = a.DoctorSchedule.Date,
                    StartTime = a.DoctorSchedule.StartTime,
                    EndTime = a.DoctorSchedule.EndTime,
                    VisitReason = a.VisitReason,
                    Status = a.AppointmentStatus.Name,
                    StatusColorCode = a.AppointmentStatus.ColorCode ?? string.Empty,
                    Symptoms = a.Symptoms,
                    Consultation = consultationDto,
                };
            })
            .ToList();

        return new GetDoctorPatientAppointmentsResponse
        {
            PatientName = $"{patient.FirstName} {patient.LastName}",
            Items = items,
        };
    }
}