using Facet.Extensions;

using Microsoft.EntityFrameworkCore;

using NodaTime.Text;

using Serilog;

using TeleHealth.Api.Common.Constants;
using TeleHealth.Api.Common.Exceptions.Schedules;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;

public sealed class GetAllAvailableSchedulesHandler(ApplicationDbContext db)
{
    public async Task<List<AvailableScheduleDto>> HandleAsync(
        GetAvailableSchedulesQuery query,
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
            .Where(s => s.StatusId == StatusId.Schedule.Available && s.Date == targetDate);

        if (query.DoctorPublicId.HasValue)
        {
            dbQuery = dbQuery.Where(s => s.Doctor.PublicId == query.DoctorPublicId.Value);
        }

        return await dbQuery
            .OrderBy(s => s.StartTime)
            .SelectFacet<DoctorSchedule, AvailableScheduleDto>()
            .ToListAsync(ct);
    }
}