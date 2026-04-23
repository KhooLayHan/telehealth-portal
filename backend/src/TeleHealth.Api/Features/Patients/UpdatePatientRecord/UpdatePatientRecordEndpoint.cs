using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetAllPatientsForClinicStaff;

namespace TeleHealth.Api.Features.Patients.UpdatePatientRecord;

public static class UpdatePatientRecordEndpoint
{
    public static void MapUpdatePatientRecordEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Patients.UpdatePatientRecord,
                async Task<Ok<ClinicStaffPatientDto>> (
                    Guid patientPublicId,
                    UpdatePatientRecordCommand cmd,
                    UpdatePatientRecordHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var updated = await handler.HandleAsync(patientPublicId, cmd, ct);
                    return TypedResults.Ok(updated);
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.UpdatePatientRecord))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.ClinicStaffPolicy)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AddEndpointFilter<ValidationFilter<UpdatePatientRecordCommand>>();
    }
}
