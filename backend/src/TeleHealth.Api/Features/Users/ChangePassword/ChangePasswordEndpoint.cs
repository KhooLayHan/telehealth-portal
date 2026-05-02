using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.ChangePassword;

// Maps the signed-in user's password change endpoint.
public static class ChangePasswordEndpoint
{
    public static void MapChangePasswordEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Users.ChangePassword,
                async Task<Results<NoContent, UnauthorizedHttpResult>> (
                    ChangePasswordCommand command,
                    ClaimsPrincipal user,
                    ChangePasswordHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                    {
                        return TypedResults.Unauthorized();
                    }

                    await handler.HandleAsync(publicId, command, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("ChangePassword")
            .WithTags("Users")
            .RequireAuthorization()
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<ChangePasswordCommand>>();
    }
}
