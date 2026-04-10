using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.GetMe;

// * NOTE: Just a temporary implementation; will remove soon once full MVP RBAC support is implemented!
public static class GetMeEndpoint
{
    public static void MapGetMeEndpoint(this RouteGroupBuilder group)
    {
        // Route: GET /api/v1/users/me
        group
            .MapGet(
                "/me",
                async (ApplicationDbContext db, ClaimsPrincipal user, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    // Fetch generic user info + roles
                    var currentUser = await db
                        .Users.AsNoTracking()
                        .Include(u => u.Roles)
                        .Where(u => u.PublicId == publicId)
                        .Select(u => new
                        {
                            u.PublicId,
                            u.Email,
                            u.FirstName,
                            u.LastName,
                            Roles = u.Roles.Select(r => r.Slug).ToList(),
                        })
                        .FirstOrDefaultAsync(ct);

                    return currentUser is not null ? Results.Ok(currentUser) : Results.NotFound();
                }
            )
            .WithName("GetMe")
            .WithTags("Users")
            .RequireAuthorization(); // Notice: NO specific policy! ANY logged-in user can hit this.
    }
}
