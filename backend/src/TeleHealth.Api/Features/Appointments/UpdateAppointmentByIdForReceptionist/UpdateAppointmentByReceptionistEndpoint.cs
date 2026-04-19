using Microsoft.AspNetCore.Mvc;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.UpdateAppointmentByIdForReceptionist;

public static class UpdateAppointmentByReceptionistEndpoint
{
    public static void MapUpdateAppointmentByReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                $"{ApiEndpoints.Appointments.UpdateById}",
                async (
                    [FromRoute] Guid id,
                    [FromBody] UpdateAppointmentByReceptionistCommand cmd,
                    UpdateAppointmentByReceptionistHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(id, cmd, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.Appointments.UpdateById))
            .WithTags(nameof(ApiEndpoints.Appointments))
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationFilter<UpdateAppointmentByReceptionistCommand>>();
    }
}