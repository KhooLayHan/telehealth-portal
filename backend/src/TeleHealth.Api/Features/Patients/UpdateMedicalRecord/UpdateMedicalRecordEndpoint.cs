using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetProfile;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalRecord;

public static class UpdateMedicalRecordEndpoint
{
    public static void MapUpdateMedicalRecordEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                $"{ApiEndpoints.Patients.MedicalRecord}",
                async Task<Results<Ok<PatientProfileDto>, UnauthorizedHttpResult>> (
                    ClaimsPrincipal user,
                    UpdateMedicalRecordCommand cmd,
                    UpdateMedicalRecordHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return TypedResults.Unauthorized();

                    var updatedProfile = await handler.HandleAsync(publicId, cmd, ct);

                    return TypedResults.Ok(updatedProfile);
                }
            )
            .WithName("UpdateMedicalInfo")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AddEndpointFilter<ValidationFilter<UpdateMedicalRecordCommand>>();
    }
}
