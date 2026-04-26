using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Users.ProfileAvatar;

public sealed record UpdateAvatarRequest(string AvatarUrl);

public static class UpdateAvatarEndpoint
{
    public static void MapUpdateAvatarEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Users.UpdateAvatar,
                async (
                    UpdateAvatarRequest request,
                    ClaimsPrincipal user,
                    ApplicationDbContext db,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var currentUser = await db.Users.FirstOrDefaultAsync(
                        u => u.PublicId == publicId,
                        ct
                    );

                    if (currentUser is null)
                        return Results.NotFound();

                    currentUser.AvatarUrl = request.AvatarUrl;
                    await db.SaveChangesAsync(ct);

                    return Results.NoContent();
                }
            )
            .WithName("UpdateAvatar")
            .WithTags("Users")
            .RequireAuthorization();
    }
}
