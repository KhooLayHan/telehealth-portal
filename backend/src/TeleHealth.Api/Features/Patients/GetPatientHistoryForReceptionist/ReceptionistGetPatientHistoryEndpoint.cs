using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetPatientHistoryForReceptionist;

public static class ReceptionistGetPatientHistoryEndpoint
{
    public static void MapReceptionistGetPatientHistoryEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Patients.GetPatientAppointmentsForReceptionist,
                async Task<Results<Ok<ReceptionistPatientHistoryResponse>, NotFound>> (
                    Guid id,
                    ReceptionistGetPatientHistoryHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(id, ct);
                    if (result is null)
                        return TypedResults.NotFound();

                    return TypedResults.Ok(result);
                }
            )
            .WithName("ReceptionistGetPatientHistory")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
