using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.DeleteReceptionist;

public static class AdminDeleteReceptionistEndpoint
{
    public static void MapAdminDeleteReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Admins.DeleteReceptionist,
                async Task<NoContent> (
                    Guid id,
                    AdminDeleteReceptionistHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(id, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("AdminDeactivateReceptionist")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
