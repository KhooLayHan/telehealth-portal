using System.Security.Claims;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetProfile;

public static class GetProfileEndpoint
{
    public static void MapGetProfileEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Patients.Me}",
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
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .Produces<PatientProfileDto>()
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
