using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.DeleteLabTech;

// Maps the admin PATCH endpoint for deactivating a lab technician account.
public static class AdminDeleteLabTechEndpoint
{
    // Registers the lab technician deactivation route with admin-only authorization.
    public static void MapAdminDeleteLabTechEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Admins.DeleteLabTech,
                async Task<NoContent> (
                    Guid id,
                    AdminDeleteLabTechHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(id, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("AdminDeactivateLabTech")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
