using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentStatuses;

public static class GetAppointmentStatusesEndpoint
{
    public static void MapGetAppointmentStatusesEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Appointments.GetAllStatuses}",
                async (GetAppointmentStatusesHandler handler, CancellationToken ct) =>
                {
                    var statuses = await handler.HandleAsync(ct);
                    return TypedResults.Ok(statuses);
                }
            )
            .WithName(nameof(ApiEndpoints.Appointments.GetAllStatuses))
            .WithTags(nameof(ApiEndpoints.Appointments))
            .RequireAuthorization()
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
