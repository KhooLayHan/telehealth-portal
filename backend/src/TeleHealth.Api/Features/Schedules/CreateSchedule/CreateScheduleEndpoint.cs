using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Schedules.GetDailySchedulesForReceptionist;

namespace TeleHealth.Api.Features.Schedules.CreateSchedule;

// Maps the endpoint for creating a doctor schedule slot.
public static class CreateScheduleEndpoint
{
    public static void MapCreateScheduleEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Schedules.CreateSchedule,
                async Task<Created<ReceptionistDoctorScheduleSlotDto>> (
                    CreateScheduleCommand command,
                    CreateScheduleHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var schedule = await handler.HandleAsync(command, ct);

                    return TypedResults.Created(
                        ApiEndpoints.Schedules.GetByIdOrSlug.Replace(
                            "{idOrSlug}",
                            schedule.PublicId.ToString()
                        ),
                        schedule
                    );
                }
            )
            .WithName(nameof(ApiEndpoints.Schedules.CreateSchedule))
            .WithTags(nameof(ApiEndpoints.Schedules))
            .RequireAuthorization(AuthConstants.AdminOrReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<CreateScheduleCommand>>();
    }
}
