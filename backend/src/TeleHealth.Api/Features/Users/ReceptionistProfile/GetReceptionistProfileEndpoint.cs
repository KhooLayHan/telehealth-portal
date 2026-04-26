using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.ReceptionistProfile;

public static class GetReceptionistProfileEndpoint
{
    public static void MapGetReceptionistProfileEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Users.GetReceptionistProfile,
                async (ClaimsPrincipal user, ApplicationDbContext db, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var profile = await db
                        .Users.AsNoTracking()
                        .Include(u => u.Roles)
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
                            Roles = u.Roles.Select(r => r.Slug).ToList(),
                        })
                        .FirstOrDefaultAsync(ct);

                    return profile is not null ? Results.Ok(profile) : Results.NotFound();
                }
            )
            .WithName("GetReceptionistProfile")
            .WithTags("Users")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy);
    }
}
