using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllLabTechs;

namespace TeleHealth.Api.Features.Admins.GetLabTech;

// Maps the admin GET endpoint for viewing one lab technician by public ID.
public static class AdminGetLabTechEndpoint
{
    public static void MapAdminGetLabTechEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetLabTech,
                async Task<Ok<AdminLabTechDto>> (
                    Guid id,
                    AdminGetLabTechHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(id, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetLabTech")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
