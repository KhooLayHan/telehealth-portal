using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentsById;

public static class ReceptionistGetAppointmentByIdEndpoint
{
    public static void MapGetAppointmentByIdForReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Appointments.GetById,
                async Task<Results<Ok<ReceptionistAppointmentDetailDto>, NotFound>> (
                    Guid id,
                    ReceptionistGetAppointmentByIdHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var appointment = await handler.HandleAsync(id, ct);
                    return appointment is null
                        ? TypedResults.NotFound()
                        : TypedResults.Ok(appointment);
                }
            )
            .WithName("GetAppointmentByIdForReceptionist")
            .WithTags("Appointments")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
