using System.Security.Claims;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Users.UpdateProfile;

namespace TeleHealth.Api.Features.Users.ReceptionistProfile;

public static class UpdateReceptionistProfileEndpoint
{
    public static void MapUpdateReceptionistProfileEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Users.GetReceptionistProfile,
                async (
                    UpdateProfileCommand cmd,
                    ClaimsPrincipal user,
                    UpdateReceptionistProfileHandler handler,
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
            .WithName("UpdateReceptionistProfile")
            .WithTags("Users")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<UpdateProfileCommand>>();
    }
}
