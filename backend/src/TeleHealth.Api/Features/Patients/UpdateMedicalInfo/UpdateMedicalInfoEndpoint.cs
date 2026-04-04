using System.Security.Claims;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetProfile;

namespace TeleHealth.Api.Features.Patients.UpdateMedicalInfo;

public static class UpdateMedicalInfoEndpoint
{
    public static void MapUpdateMedicalInfoFeature(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                "/me/medical-info",
                async (
                    ClaimsPrincipal user,
                    UpdateMedicalInfoCommand command,
                    GetProfileHandler handler,
                    UpdateMedicalInfoHandler updateHandler,
                    CancellationToken ct
                ) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var success = await updateHandler.HandleAsync(publicId, command, ct);
                    if (!success)
                        return Results.NotFound("Patient profile not found.");

                    var updatedProfile = await handler.HandleAsync(publicId, ct);

                    return updatedProfile is not null
                        ? Results.Ok(updatedProfile)
                        : Results.NotFound("Patient profile not found.");
                }
            )
            .WithName("UpdateMedicalInfo")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .AddEndpointFilter<ValidationFilter<UpdateMedicalInfoCommand>>();
    }
}
