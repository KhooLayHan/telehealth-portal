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
            .Where(s => s.Date == targetDate);

        if (query.DoctorPublicId.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.Doctor.PublicId == query.DoctorPublicId.Value);
        }

        var schedules = await dbQuery
            .OrderBy(s => s.StartTime)
            .ThenBy(s => s.Doctor.User.LastName)
            .ToListAsync(ct);

        var scheduleIds = schedules.Select(s => s.Id).ToList();

        // Load all appointments for these slots, then pick the most recent per slot.
        // This ensures cancelled/completed statuses are shown correctly, and a re-booked
        // slot shows the new active appointment rather than the old cancelled one.
        var allAppointments = await db.Appointments
            .AsNoTracking()
            .Include(a => a.Patient)
                .ThenInclude(p => p.User)
            .Include(a => a.AppointmentStatus)
            .Where(a => scheduleIds.Contains(a.ScheduleId))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);

        var apptBySchedule = allAppointments
            .GroupBy(a => a.ScheduleId)
            .ToDictionary(g => g.Key, g => g.First());

        return schedules
            .Select(s =>
            {
                apptBySchedule.TryGetValue(s.Id, out var appt);
                return new ReceptionistDoctorScheduleSlotDto
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
                    AppointmentPublicId = appt?.PublicId,
                    PatientName = appt is not null
                        ? $"{appt.Patient.User.FirstName} {appt.Patient.User.LastName}"
                        : null,
                    VisitReason = appt?.VisitReason,
                    AppointmentStatus = appt?.AppointmentStatus.Name,
                    AppointmentStatusColorCode = appt?.AppointmentStatus.ColorCode,
                };
            })
            .ToList();
    }
}