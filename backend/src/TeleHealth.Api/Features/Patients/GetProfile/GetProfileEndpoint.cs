using System.Security.Claims;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public static class GetProfileEndpoint
{
    public static void MapGetMyProfileFeature(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                "/me",
                async (ClaimsPrincipal user, GetProfileHandler handler, CancellationToken ct) =>
                {
                    var publicIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(publicIdString, out var publicId))
                        return Results.Unauthorized();

                    var profile = await handler.HandleAsync(publicId, ct);

                    return profile is not null ? Results.Ok(profile) : Results.NotFound();
                }
            )
            .WithName("GetMyProfile")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy);
    }
}
 