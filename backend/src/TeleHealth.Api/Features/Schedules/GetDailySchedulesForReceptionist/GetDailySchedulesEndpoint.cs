using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;

public static class GetDailySchedulesEndpoint
{
    public static void MapGetDailySchedulesEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Schedules.GetDailyForReceptionist,
                async Task<Ok<List<ReceptionistDoctorScheduleSlotDto>>> (
                    [AsParameters] GetDailySchedulesQuery query,
                    GetDailySchedulesHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var slots = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(slots);
                }
            )
            .WithName("GetDailySchedulesForReceptionist")
            .WithTags(nameof(ApiEndpoints.Schedules))
            .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
