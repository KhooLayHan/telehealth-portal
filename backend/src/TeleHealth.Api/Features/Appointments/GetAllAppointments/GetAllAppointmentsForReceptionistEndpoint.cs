using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.GetAllAppointments;

public static class GetAllAppointmentsForReceptionistEndpoint
{
    public static void MapGetAllAppointmentsForReceptionistEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Appointments.GetAllAppointments,
                async Task<Ok<PagedResult<ReceptionistAppointmentDto>>> (
                    [AsParameters] GetAllAppointmentsForReceptionistQuery query,
                    GetAllAppointmentsForReceptionistHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var appointments = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(appointments);
                }
            )
            .WithName("GetAllAppointmentsForReceptionist")
            .WithTags("Appointments")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
