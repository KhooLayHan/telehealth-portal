using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public sealed class GetProfileHandler(ApplicationDbContext db)
{
    public async Task<PatientProfileDto?> HandleAsync(Guid userPublicId, CancellationToken ct)
    {
        return await db
            .Patients.AsNoTracking()
            .Where(p => p.User.PublicId == userPublicId)
            .Select(PatientProfileDto.Projection)
            .FirstOrDefaultAsync(ct);
    }
}
