using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;

namespace TeleHealth.Api.Features.Patients.GetPatientByIdForReceptionist;

public static class ReceptionistGetPatientByIdEndpoint
{
    public static void MapReceptionistGetPatientByIdEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Patients.GetById,
                async Task<Results<Ok<ReceptionistPatientsDto>, NotFound>> (
                    Guid id,
                    ReceptionistGetPatientByIdHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var patient = await handler.HandleAsync(id, ct);
                    return patient is null ? TypedResults.NotFound() : TypedResults.Ok(patient);
                }
            )
            .WithName("ReceptionistGetPatientById")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}