using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetAllReceptionists;

// Maps the admin endpoint for listing all active receptionists
public static class AdminGetAllReceptionistsEndpoint
{
    public static void MapAdminGetAllReceptionistsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetAllReceptionists,
                async Task<Ok<PagedResult<AdminReceptionistDto>>> (
                    [AsParameters] AdminGetAllReceptionistsQuery query,
                    AdminGetAllReceptionistsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetAllReceptionists")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
