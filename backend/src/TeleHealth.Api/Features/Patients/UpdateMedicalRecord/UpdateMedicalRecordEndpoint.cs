using System.Security.Claims;
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
                async (
                    ClaimsPrincipal user,
                    UpdateMedicalRecordCommand cmd,
                    UpdateMedicalRecordHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var updatedProfile = await handler.HandleAsync(publicId, cmd, ct);

                    return updatedProfile is not null
                        ? Results.Ok(updatedProfile)
                        : Results.NotFound("Patient profile not found.");
                }
            )
            .WithName("UpdateMedicalInfo")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .AddEndpointFilter<ValidationFilter<UpdateMedicalRecordCommand>>()
            .Produces<PatientProfileDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
