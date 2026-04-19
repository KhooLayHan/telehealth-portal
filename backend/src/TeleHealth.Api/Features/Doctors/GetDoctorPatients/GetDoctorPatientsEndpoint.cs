using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatients;

public static class GetDoctorPatientsEndpoint
{
    public static void MapGetDoctorPatientsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Doctors.GetPatients,
                async Task<Ok<GetDoctorPatientsResponse>> (
                    [AsParameters] GetDoctorPatientsQuery query,
                    ClaimsPrincipal user,
                    GetDoctorPatientsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                        throw new TokenInvalidException();

                    var result = await handler.HandleAsync(publicId, query, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("GetDoctorPatients")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.DoctorPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
