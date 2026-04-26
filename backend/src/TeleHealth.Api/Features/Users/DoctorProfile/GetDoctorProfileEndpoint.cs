using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.DoctorProfile;

public static class GetDoctorProfileEndpoint
{
    public static void MapGetDoctorProfileEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Users.GetDoctorProfile,
                async (ClaimsPrincipal user, ApplicationDbContext db, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var profile = await db
                        .Users.AsNoTracking()
                        .Include(u => u.Roles)
                        .Include(u => u.Doctor)
                        .Where(u => u.PublicId == publicId)
                        .Select(u => new
                        {
                            u.PublicId,
                            u.Email,
                            u.FirstName,
                            u.LastName,
                            u.AvatarUrl,
                            u.Phone,
                            u.IcNumber,
                            Address = u.Address != null ? u.Address.Street : null,
                            LicenseNumber = u.Doctor != null ? u.Doctor.LicenseNumber : null,
                            Specialization = u.Doctor != null ? u.Doctor.Specialization : null,
                            Roles = u.Roles.Select(r => r.Slug).ToList(),
                        })
                        .FirstOrDefaultAsync(ct);

                    return profile is not null ? Results.Ok(profile) : Results.NotFound();
                }
            )
            .WithName("GetDoctorProfile")
            .WithTags("Users")
            .RequireAuthorization(AuthConstants.DoctorPolicy);
    }
}
