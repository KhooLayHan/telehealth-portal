using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllReceptionists;

namespace TeleHealth.Api.Features.Admins.CreateReceptionist;

public static class AdminCreateReceptionistEndpoint
{
    public static void MapAdminCreateReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Admins.CreateReceptionist,
                async Task<Created<AdminReceptionistDto>> (
                    AdminCreateReceptionistCommand cmd,
                    AdminCreateReceptionistHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created(
                        $"/api/v1/admins/receptionists/{result.PublicId}",
                        result
                    );
                }
            )
            .WithName("AdminCreateReceptionist")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminCreateReceptionistCommand>>();
    }
}
