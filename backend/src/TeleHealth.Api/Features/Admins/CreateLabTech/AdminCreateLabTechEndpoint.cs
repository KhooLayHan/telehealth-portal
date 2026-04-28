using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;

namespace TeleHealth.Api.Features.Admins.CreateLabTech;

// Maps the admin endpoint for creating lab technician accounts.
public static class AdminCreateLabTechEndpoint
{
    // Registers POST /admins/lab-techs for admin users.
    public static void MapAdminCreateLabTechEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Admins.CreateLabTech,
                async Task<Created<AdminLabTechDto>> (
                    AdminCreateLabTechCommand cmd,
                    AdminCreateLabTechHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created(
                        $"/api/v1/admins/lab-techs/{result.PublicId}",
                        result
                    );
                }
            )
            .WithName("AdminCreateLabTech")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminCreateLabTechCommand>>();
    }
}
