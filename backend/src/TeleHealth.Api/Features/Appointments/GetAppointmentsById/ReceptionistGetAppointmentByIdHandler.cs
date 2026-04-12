using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentsById;

public sealed class ReceptionistGetAppointmentByIdHandler(ApplicationDbContext db)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<ReceptionistAppointmentDetailDto?> HandleAsync(Guid id, CancellationToken ct)
    {
        var appointment = await db
            .Appointments.AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.Doctor)
                .ThenInclude(d => d.User)
            .Include(a => a.DoctorSchedule)
            .Include(a => a.AppointmentStatus)
            .Where(a => a.PublicId == id)
            .FirstOrDefaultAsync(ct);

        if (appointment is null)
            return null;

        // Read symptoms directly from the JSONB column to avoid EF Core naming convention mismatch
        var symptomsJson = await db
            .Database.SqlQuery<string>(
                $"SELECT symptoms::text AS \"Value\" FROM appointments WHERE public_id = {id}"
            )
            .FirstOrDefaultAsync(ct);

        var symptoms = symptomsJson is null
            ? null
            : JsonSerializer.Deserialize<List<Symptom>>(symptomsJson, JsonOptions);

        return new ReceptionistAppointmentDetailDto
        {
            PublicId = appointment.PublicId,
            Slug = appointment.Slug,
            VisitReason = appointment.VisitReason,
            CancellationReason = appointment.CancellationReason,
            PatientName =
                $"{appointment.Patient.User.FirstName} {appointment.Patient.User.LastName}",
            DoctorName = $"{appointment.Doctor.User.FirstName} {appointment.Doctor.User.LastName}",
            Specialization = appointment.Doctor.Specialization,
            Date = appointment.DoctorSchedule.Date,
            StartTime = appointment.DoctorSchedule.StartTime,
            EndTime = appointment.DoctorSchedule.EndTime,
            Status = appointment.AppointmentStatus.Name,
            StatusColorCode = appointment.AppointmentStatus.ColorCode ?? string.Empty,
            Symptoms = symptoms,
        };
    }
}
