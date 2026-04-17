using Microsoft.EntityFrameworkCore;

using NodaTime.Text;

using Serilog;

using TeleHealth.Api.Common.Exceptions.Schedules;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;

public sealed class GetDailySchedulesHandler(ApplicationDbContext db)
{
    public async Task<List<ReceptionistDoctorScheduleSlotDto>> HandleAsync(
        GetDailySchedulesQuery query,
        CancellationToken ct
    )
    {
        if (string.IsNullOrWhiteSpace(query.Date))
        {
            Log.Warning("A valid date (YYYY-MM-DD) must be provided in the query string");
            throw new InvalidateDateException();
        }

        var parseResult = LocalDatePattern.Iso.Parse(query.Date);
        if (!parseResult.Success)
        {
            Log.Warning("Invalid date format. Use YYYY-MM-DD.");
            throw new InvalidateDateException();
        }

        var targetDate = parseResult.Value;

        var dbQuery = db
            .DoctorSchedules.AsNoTracking()
            .Include(s => s.ScheduleStatus)
            .Include(s => s.Doctor)
            .ThenInclude(d => d.User)
            .Include(s => s.Appointment)
            .ThenInclude(a => a!.Patient)
            .ThenInclude(p => p.User)
            .Include(s => s.Appointment)
            .ThenInclude(a => a!.AppointmentStatus)
            .Where(s => s.Date == targetDate);

        if (query.DoctorPublicId.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.Doctor.PublicId == query.DoctorPublicId.Value);
        }

        var schedules = await dbQuery
            .OrderBy(s => s.StartTime)
            .ThenBy(s => s.Doctor.User.LastName)
            .ToListAsync(ct);

        return schedules
            .Select(s => new ReceptionistDoctorScheduleSlotDto
            {
                PublicId = s.PublicId,
                Date = s.Date,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                ScheduleStatus = s.ScheduleStatus.Name,
                ScheduleStatusColorCode = s.ScheduleStatus.ColorCode,
                DoctorPublicId = s.Doctor.PublicId,
                DoctorName = $"Dr. {s.Doctor.User.FirstName} {s.Doctor.User.LastName}",
                DoctorSpecialization = s.Doctor.Specialization,
                AppointmentPublicId = s.Appointment?.PublicId,
                PatientName = s.Appointment is { } a
                    ? $"{a.Patient.User.FirstName} {a.Patient.User.LastName}"
                    : null,
                VisitReason = s.Appointment?.VisitReason,
                AppointmentStatus = s.Appointment?.AppointmentStatus.Name,
                AppointmentStatusColorCode = s.Appointment?.AppointmentStatus.ColorCode,
            })
            .ToList();
    }
}