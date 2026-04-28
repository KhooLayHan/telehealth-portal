using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Schedules.DeleteSchedule;

// Maps the endpoint for removing an available doctor schedule slot.
public static class DeleteScheduleEndpoint
{
    public static void MapDeleteScheduleEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Schedules.DeleteById,
                async ([FromRoute] Guid id, DeleteScheduleHandler handler, CancellationToken ct) =>
                {
                    await handler.HandleAsync(id, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.Schedules.DeleteById))
            .WithTags(nameof(ApiEndpoints.Schedules))
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
