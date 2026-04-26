using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.Remind;

public static class RemindPatientEndpoint
{
    public static void MapRemindPatientEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                $"{ApiEndpoints.Appointments.RemindPatient}",
                async (
                    [Microsoft.AspNetCore.Mvc.FromRoute] Guid id,
                    [Microsoft.AspNetCore.Mvc.FromServices] RemindPatientHandler handler,
                    CancellationToken ct
                ) => await handler.HandleAsync(id, ct)
            )
            .WithName(nameof(ApiEndpoints.Appointments.RemindPatient))
            .WithTags(nameof(ApiEndpoints.Appointments))
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .Produces(StatusCodes.Status204NoContent)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
