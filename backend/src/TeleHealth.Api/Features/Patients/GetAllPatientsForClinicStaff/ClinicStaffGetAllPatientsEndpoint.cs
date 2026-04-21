using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

public static class ClinicStaffGetAllPatientsEndpoint
{
    public static void MapClinicStaffGetAllPatientsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Patients.GetAllPatientsForClinicStaff,
                async Task<Ok<PagedResult<ClinicStaffPatientDto>>> (
                    [AsParameters] ClinicStaffGetAllPatientsQuery query,
                    ClinicStaffGetAllPatientsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var patients = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(patients);
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.GetAllPatientsForClinicStaff))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.ClinicStaffPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
