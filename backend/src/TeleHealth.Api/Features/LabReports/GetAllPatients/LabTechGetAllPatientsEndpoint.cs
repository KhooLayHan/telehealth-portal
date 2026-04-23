using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.LabReports.GetAllPatients;

public static class LabTechGetAllPatientsEndpoint
{
    public static void MapLabTechGetAllPatientsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.LabReports.GetAllPatients,
                async Task<Ok<PagedResult<LabTechPatientDto>>> (
                    [AsParameters] LabTechGetAllPatientsQuery query,
                    LabTechGetAllPatientsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var patients = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(patients);
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.GetAllPatients))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
