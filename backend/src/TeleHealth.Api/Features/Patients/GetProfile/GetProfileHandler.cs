using Facet.Extensions;
using Microsoft.EntityFrameworkCore;
using Serilog;
using TeleHealth.Api.Common.Exceptions.Patients;
using TeleHealth.Api.Domain.Entities;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public sealed class GetProfileHandler(ApplicationDbContext db)
{
    public async Task<PatientProfileDto> HandleAsync(Guid userPublicId, CancellationToken ct)
    {
        var profile = await db
            .Patients.AsNoTracking()
            .Where(p => p.User.PublicId == userPublicId)
            .Select(PatientProfileDto.Projection)
            .FirstOrDefaultAsync(ct);

        if (profile is null)
        {
            Log.Warning("Patient not found. PatientId: {PatientId}", userPublicId);
            throw new PatientNotFoundException();
        }

        return profile;
    }
}
