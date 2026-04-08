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
            .Select(p => new PatientProfileDto(
                p.User.PublicId,
                p.PublicId,
                p.User.FirstName,
                p.User.LastName,
                p.User.Email,
                p.User.Roles.First().Slug, // matches ClaimTypes.Role in TokenService
                p.BloodGroup,
                p.EmergencyContact,
                p.Allergies
            ))
            .FirstOrDefaultAsync(ct);
    }
}
