using System.Security.Claims;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.UpdateProfile;

public static class UpdateProfileEndpoint
{
    public static void MapUpdateProfileEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Users.UpdateProfile,
                async (
                    UpdateProfileCommand cmd,
                    ClaimsPrincipal user,
                    UpdateProfileHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var result = await handler.HandleAsync(publicId, cmd, ct);
                    return Results.Ok(result);
                }
            )
            .WithName("UpdateProfile")
            .WithTags("Users")
            .RequireAuthorization()
            .Produces<UpdateProfileResult>()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<UpdateProfileCommand>>();
    }
}
