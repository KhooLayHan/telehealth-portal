using System.Security.Claims;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.UpdateMedicalInfo;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public static class UpdateMedicalInfoEndpoint
{
    public static void MapUpdateMedicalInfoFeature(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                "/me/medical-info",
                async (ClaimsPrincipal user, UpdateMedicalInfoCommand command, GetProfileHandler handler, UpdateMedicalInfoHandler updateHandler, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var success = await updateHandler.HandleAsync(publicId, command, ct);
                    if (!success) return Results.NotFound("Patient profile not found.");

                    var updatedProfile = await handler.HandleAsync(publicId, ct);
                    return Results.Ok(updatedProfile);
                }
            )
            .WithName("UpdateMedicalInfo")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .AddEndpointFilter<ValidationFilter<UpdateMedicalInfoCommand>>();
    }
}
