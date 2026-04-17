using Microsoft.EntityFrameworkCore;

using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public sealed class GetAllDoctorsHandler(ApplicationDbContext db)
{
    public async Task<List<DoctorListDto>> HandleAsync(CancellationToken ct)
    {
        return await db
            .Doctors.AsNoTracking()
            .OrderBy(d => d.Id)
            .Select(DoctorListDto.Projection)
            .ToListAsync(ct);
    }
}