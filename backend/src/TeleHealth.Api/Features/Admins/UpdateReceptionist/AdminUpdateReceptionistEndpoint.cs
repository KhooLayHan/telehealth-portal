using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllReceptionists;

namespace TeleHealth.Api.Features.Admins.UpdateReceptionist;

// Maps the admin PUT endpoint for updating an existing receptionist's details
public static class AdminUpdateReceptionistEndpoint
{
    public static void MapAdminUpdateReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Admins.UpdateReceptionist,
                async Task<Ok<AdminReceptionistDto>> (
                    Guid id,
                    AdminUpdateReceptionistCommand cmd,
                    AdminUpdateReceptionistHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(id, cmd, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminUpdateReceptionist")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminUpdateReceptionistCommand>>();
    }
}
