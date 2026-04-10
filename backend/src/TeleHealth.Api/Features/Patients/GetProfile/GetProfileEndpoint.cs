using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
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
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

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
