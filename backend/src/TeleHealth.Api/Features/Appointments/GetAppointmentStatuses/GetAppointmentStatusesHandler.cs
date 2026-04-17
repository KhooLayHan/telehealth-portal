using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentStatuses;

public sealed class GetAppointmentStatusesHandler(ApplicationDbContext db)
{
    public async Task<List<AppointmentStatusesDto>> HandleAsync(CancellationToken ct)
    {
        return await db
            .AppointmentStatuses.AsNoTracking()
            .OrderBy(s => s.Id)
            .Select(s => new AppointmentStatusesDto
            {
                Id = s.Id,
                Slug = s.Slug,
                Name = s.Name,
                ColorCode = s.ColorCode ?? string.Empty,
                IsTerminal = s.IsTerminal,
                Description = s.Description ?? string.Empty,
            })
            .ToListAsync(ct);
    }
}