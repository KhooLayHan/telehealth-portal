using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForReceptionist;

public static class ReceptionistGetAllPatientsEndpoint
{
    public static void MapReceptionistGetAllPatientsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Patients.GetAllPatientsForReceptionist,
                async Task<Ok<PagedResult<ReceptionistPatientsDto>>> (
                    [AsParameters] ReceptionistGetAllPatientsQuery query,
                    ReceptionistGetAllPatientsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var patients = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(patients);
                }
            )
            .WithName("ReceptionistGetAllPatients")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.ReceptionistPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
