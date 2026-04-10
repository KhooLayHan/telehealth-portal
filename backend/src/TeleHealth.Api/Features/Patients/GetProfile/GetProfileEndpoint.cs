using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
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
                async Task<Ok<PatientProfileDto>> (
                    ClaimsPrincipal user,
                    GetProfileHandler handler,
                    CancellationToken ct
                ) =>
                {
                    // If this throws, it's a config bug — let it surface as 500
                    var publicId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
                    var profile = await handler.HandleAsync(publicId, ct);

                    return TypedResults.Ok(profile);
                }
            )
            .WithName("GetMyProfile")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
