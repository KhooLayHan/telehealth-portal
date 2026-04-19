using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.GetSchedule;

public static class GetDoctorScheduleEndpoint
{
    public static void MapGetDoctorScheduleEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Doctors.GetSchedule,
                async Task<Ok<DoctorScheduleResponse>> (
                    [AsParameters] GetDoctorScheduleQuery query,
                    ClaimsPrincipal user,
                    GetDoctorScheduleHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                        throw new TokenInvalidException();

                    var schedule = await handler.HandleAsync(publicId, query, ct);
                    return TypedResults.Ok(schedule);
                }
            )
            .WithName("GetDoctorSchedule")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.DoctorPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
