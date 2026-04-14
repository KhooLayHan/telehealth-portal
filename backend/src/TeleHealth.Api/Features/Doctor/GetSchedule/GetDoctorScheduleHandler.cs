using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Doctors;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctor.GetSchedule;

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
        var date = query.Date.HasValue ? LocalDate.FromDateOnly(query.Date.Value) : utcNow.Date;
        var timeNow = utcNow.TimeOfDay;

        var doctor = await db
            .Doctors.AsNoTracking()
            .Where(d => d.User.PublicId == userPublicId)
            .Select(d => new { d.Id })
            .FirstOrDefaultAsync(ct);

        if (doctor is null)
            throw new DoctorNotFoundException(userPublicId.ToString());

        var doctorId = doctor.Id;

        // Base query: this doctor's appointments for the requested date
        var q = db
            .Appointments.AsNoTracking()
            .Where(a => a.DoctorId == doctorId && a.DoctorSchedule.Date == date);

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

        // Pending = booked but not yet started
        var pendingCount = await db
            .Appointments.AsNoTracking()
            .CountAsync(
                a =>
                    a.DoctorId == doctorId
                    && a.DoctorSchedule.Date == date
                    && a.StatusId == StatusId.Appointment.Booked,
                ct
            );

        // Next appointment = soonest start time still in the future, not completed/cancelled
        var nextAppointmentTime = await db
            .Appointments.AsNoTracking()
            .Where(a =>
                a.DoctorId == doctorId
                && a.DoctorSchedule.Date == date
                && a.DoctorSchedule.StartTime > timeNow
                && (
                    a.StatusId == StatusId.Appointment.Booked
                    || a.StatusId == StatusId.Appointment.CheckedIn
                )
            )
            .OrderBy(a => a.DoctorSchedule.StartTime)
            .Select(a => (LocalTime?)a.DoctorSchedule.StartTime)
            .FirstOrDefaultAsync(ct);

        q =
            query.SortOrder?.ToLowerInvariant() == "desc"
                ? q.OrderByDescending(a => a.DoctorSchedule.StartTime)
                : q.OrderBy(a => a.DoctorSchedule.StartTime);

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
