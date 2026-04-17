using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Schedules.GetAllAvailableSchedules;

public static class GetAllAvailableSchedulesEndpoint
{
    public static void MapGetAllAvailableSchedulesEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Schedules.GetAllAvailable}",
                async (
                    [AsParameters] GetAvailableSchedulesQuery query,
                    GetAllAvailableSchedulesHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var slots = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(slots);
                }
            )
            .WithName(nameof(ApiEndpoints.Schedules.GetAllAvailable))
            .WithTags(nameof(ApiEndpoints.Schedules))
            .RequireAuthorization()
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}