using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Serilog;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetAllAppointments;

public sealed class GetAllAppointmentsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 50;

    public async Task<PagedResult<AppointmentDto>> HandleAsync(
        Guid userPublicId,
        GetAllAppointmentsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);
        var now = SystemClock.Instance.GetCurrentInstant().InUtc();

        var q = db.Appointments.AsNoTracking().Where(a => a.Patient.User.PublicId == userPublicId);

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
                EF.Functions.ILike($"{a.Doctor.User.FirstName} {a.Doctor.User.LastName}", pattern)
                || EF.Functions.ILike(a.VisitReason, pattern)
            );
        }

        q = query.SortOrder?.ToLowerInvariant() switch
        {
            "desc" => q.OrderByDescending(a => a.DoctorSchedule.Date)
                .ThenByDescending(a => a.DoctorSchedule.StartTime),
            _ => q.OrderBy(a => a.DoctorSchedule.Date).ThenBy(a => a.DoctorSchedule.StartTime),
        };

        var totalCount = await q.CountAsync(ct);

        var items = await q.Skip((page - 1) * pageSize)
            .Take(pageSize)
            .SelectFacet<Appointment, AppointmentDto>()
            .ToListAsync(ct);

        Log.Information(
            "Retrieved {TotalCount} appointments for user {UserPublicId}",
            totalCount,
            userPublicId
        );
        return new PagedResult<AppointmentDto>(items, totalCount, page, pageSize);
    }
}
