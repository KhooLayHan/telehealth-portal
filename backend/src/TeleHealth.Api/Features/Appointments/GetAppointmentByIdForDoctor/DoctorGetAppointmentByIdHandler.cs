using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentByIdForDoctor;

public sealed class DoctorGetAppointmentByIdHandler(ApplicationDbContext db)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<DoctorAppointmentDetailDto?> HandleAsync(
        Guid id,
        Guid doctorPublicId,
        CancellationToken ct
    )
    {
        var appointment = await db
            .Appointments.AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.DoctorSchedule)
            .Include(a => a.AppointmentStatus)
            .Where(a => a.PublicId == id && a.Doctor.User.PublicId == doctorPublicId)
            .FirstOrDefaultAsync(ct);

        if (appointment is null)
            return null;

        var symptomsJson = await db
            .Database.SqlQuery<string>(
                $"SELECT symptoms::text AS \"Value\" FROM appointments WHERE public_id = {id}"
            )
            .FirstOrDefaultAsync(ct);

        var symptoms = symptomsJson is null
            ? null
            : JsonSerializer.Deserialize<List<Symptom>>(symptomsJson, JsonOptions);

        var dob = appointment.Patient.User.DateOfBirth;
        var today = LocalDate.FromDateOnly(DateOnly.FromDateTime(DateTime.UtcNow));
        var age = today.Year - dob.Year;

        var genderMap = new Dictionary<string, string>
        {
            { "M", "Male" },
            { "F", "Female" },
            { "O", "Other" },
            { "N", "Not specified" },
        };
        var gender = genderMap.GetValueOrDefault(
            appointment.Patient.User.Gender.ToString(),
            "Not specified"
        );

        return new DoctorAppointmentDetailDto
        {
            PublicId = appointment.PublicId,
            Slug = appointment.Slug,
            VisitReason = appointment.VisitReason,
            PatientName =
                $"{appointment.Patient.User.FirstName} {appointment.Patient.User.LastName}",
            PatientAge = age,
            PatientGender = gender,
            Date = appointment.DoctorSchedule.Date,
            StartTime = appointment.DoctorSchedule.StartTime,
            EndTime = appointment.DoctorSchedule.EndTime,
            Status = appointment.AppointmentStatus.Name,
            StatusColorCode = appointment.AppointmentStatus.ColorCode ?? string.Empty,
            Symptoms = symptoms,
        };
    }
}
