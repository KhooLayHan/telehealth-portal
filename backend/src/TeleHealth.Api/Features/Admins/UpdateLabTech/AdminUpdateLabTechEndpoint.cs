using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;

namespace TeleHealth.Api.Features.Admins.UpdateLabTech;

// Maps the admin PUT endpoint for updating an existing lab technician's details.
public static class AdminUpdateLabTechEndpoint
{
    public static void MapAdminUpdateLabTechEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Admins.UpdateLabTech,
                async Task<Ok<AdminLabTechDto>> (
                    Guid id,
                    AdminUpdateLabTechCommand cmd,
                    AdminUpdateLabTechHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(id, cmd, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminUpdateLabTech")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminUpdateLabTechCommand>>();
    }
}
