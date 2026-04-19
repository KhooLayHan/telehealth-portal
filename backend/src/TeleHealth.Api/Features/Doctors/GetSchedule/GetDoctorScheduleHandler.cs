using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetSchedule;

public sealed class GetDoctorScheduleHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<DoctorScheduleResponse> HandleAsync(
        Guid userPublicId,
        GetDoctorScheduleQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var utcNow = SystemClock.Instance.GetCurrentInstant().InUtc();
        var date = query.Date.HasValue
            ? (LocalDate?)LocalDate.FromDateOnly(query.Date.Value)
            : null;
        var todayDate = utcNow.Date;
        var timeNow = utcNow.TimeOfDay;

        var doctor = await db
            .Doctors.AsNoTracking()
            .Where(d => d.User.PublicId == userPublicId)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        if (doctor is null)
            return new DoctorScheduleResponse
            {
                Items = [],
                TotalCount = 0,
                PendingCount = 0,
                NextAppointmentTime = null,
                Page = page,
                PageSize = pageSize,
            };

        var doctorId = doctor.Id;

        // Base query: this doctor's appointments, optionally filtered by date
        var q = db.Appointments.AsNoTracking().Where(a => a.DoctorId == doctorId);

        if (date.HasValue)
            q = q.Where(a => a.DoctorSchedule.Date == date.Value);

        if (query.Status is not null)
            q = q.Where(a => a.AppointmentStatus.Slug == query.Status);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(a =>
                EF.Functions.ILike(
                    a.Patient.User.FirstName + " " + a.Patient.User.LastName,
                    pattern
                ) || EF.Functions.ILike(a.VisitReason, pattern)
            );
        }

        var totalCount = await q.CountAsync(ct);

        // Pending = booked appointments on the queried date (or today if no date given)
        var statsDate = date ?? todayDate;
        var pendingCount = await db
            .Appointments.AsNoTracking()
            .CountAsync(
                a =>
                    a.DoctorId == doctorId
                    && a.DoctorSchedule.Date == statsDate
                    && a.StatusId == StatusId.Appointment.Booked,
                ct
            );

        // Next appointment = soonest start time still in the future on statsDate
        var nextAppointmentTime = await db
            .Appointments.AsNoTracking()
            .Where(a =>
                a.DoctorId == doctorId
                && a.DoctorSchedule.Date == statsDate
                && a.DoctorSchedule.StartTime > timeNow
                && (
                    a.StatusId == StatusId.Appointment.Booked
                    || a.StatusId == StatusId.Appointment.CheckedIn
                )
            )
            .OrderBy(a => a.DoctorSchedule.StartTime)
            .Select(a => (LocalTime?)a.DoctorSchedule.StartTime)
            .FirstOrDefaultAsync(ct);

        // Date DESC (latest first), then time ASC (earliest slot first within each day)
        q = q.OrderByDescending(a => a.DoctorSchedule.Date).ThenBy(a => a.DoctorSchedule.StartTime);

        var items = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new DoctorAppointmentDto
            {
                PublicId = a.PublicId,
                Slug = a.Slug,
                PatientName = a.Patient.User.FirstName + " " + a.Patient.User.LastName,
                VisitReason = a.VisitReason,
                Status = a.AppointmentStatus.Name,
                StatusColorCode = a.AppointmentStatus.ColorCode ?? string.Empty,
                Date = a.DoctorSchedule.Date,
                StartTime = a.DoctorSchedule.StartTime,
                EndTime = a.DoctorSchedule.EndTime,
            })
            .ToListAsync(ct);

        return new DoctorScheduleResponse
        {
            Items = items,
            TotalCount = totalCount,
            PendingCount = pendingCount,
            NextAppointmentTime = nextAppointmentTime,
            Page = page,
            PageSize = pageSize,
        };
    }
}
