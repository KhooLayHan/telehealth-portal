using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetAllLabTechs;

// Maps the admin endpoint for listing all active lab technicians
public static class AdminGetAllLabTechsEndpoint
{
    public static void MapAdminGetAllLabTechsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetAllLabTechs,
                async Task<Ok<PagedResult<AdminLabTechDto>>> (
                    [AsParameters] AdminGetAllLabTechsQuery query,
                    AdminGetAllLabTechsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetAllLabTechs")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
