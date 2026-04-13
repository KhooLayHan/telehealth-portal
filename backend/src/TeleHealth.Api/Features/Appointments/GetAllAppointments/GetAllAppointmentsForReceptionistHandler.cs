using Microsoft.EntityFrameworkCore;
using NodaTime;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.GetAllAppointments;

public sealed class GetAllAppointmentsForReceptionistHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<ReceptionistAppointmentDto>> HandleAsync(
        GetAllAppointmentsForReceptionistQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var now = SystemClock.Instance.GetCurrentInstant().InUtc();

        // No patient filter — returns ALL appointments
        var q = db.Appointments.AsNoTracking();

        q = query.View?.ToLowerInvariant() switch
        {
            "upcoming" => q.Where(a =>
                a.DoctorSchedule.Date > now.Date
                || (a.DoctorSchedule.Date == now.Date && a.DoctorSchedule.EndTime > now.TimeOfDay)
            ),
            "past" => q.Where(a =>
                a.DoctorSchedule.Date < now.Date
                || (a.DoctorSchedule.Date == now.Date && a.DoctorSchedule.EndTime <= now.TimeOfDay)
            ),
            _ => q,
        };

        if (query.Status is not null)
            q = q.Where(a => a.AppointmentStatus.Slug == query.Status);

        if (query.DoctorId is not null)
            q = q.Where(a => a.Doctor.PublicId == query.DoctorId);

        if (query.From is not null)
            q = q.Where(a => a.DoctorSchedule.Date >= LocalDate.FromDateOnly(query.From.Value));

        if (query.To is not null)
            q = q.Where(a => a.DoctorSchedule.Date <= LocalDate.FromDateOnly(query.To.Value));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var pattern = $"%{query.Search}%";
            q = q.Where(a =>
                EF.Functions.ILike(a.Doctor.User.FirstName + " " + a.Doctor.User.LastName, pattern)
                || EF.Functions.ILike(
                    a.Patient.User.FirstName + " " + a.Patient.User.LastName,
                    pattern
                )
                || EF.Functions.ILike(a.VisitReason, pattern)
            );
        }

        q =
            query.SortOrder?.ToLowerInvariant() == "desc"
                ? q.OrderByDescending(a => a.DoctorSchedule.Date)
                    .ThenByDescending(a => a.DoctorSchedule.StartTime)
                : q.OrderBy(a => a.DoctorSchedule.Date).ThenBy(a => a.DoctorSchedule.StartTime);

        var totalCount = await q.CountAsync(ct);

        var items = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ReceptionistAppointmentDto
            {
                PublicId = a.PublicId,
                Slug = a.Slug,
                VisitReason = a.VisitReason,
                PatientName = a.Patient.User.FirstName + " " + a.Patient.User.LastName,
                DoctorName = a.Doctor.User.FirstName + " " + a.Doctor.User.LastName,
                Specialization = a.Doctor.Specialization,
                Status = a.AppointmentStatus.Name,
                StatusColorCode = a.AppointmentStatus.ColorCode ?? string.Empty,
                Date = a.DoctorSchedule.Date,
                StartTime = a.DoctorSchedule.StartTime,
                EndTime = a.DoctorSchedule.EndTime,
            })
            .ToListAsync(ct);

        return new PagedResult<ReceptionistAppointmentDto>(items, totalCount, page, pageSize);
    }
}
