using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public static class GetAllDoctorsEndpoint
{
    public static void MapGetAllDoctorsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Doctors.GetAll}",
                async Task<Ok<PagedResult<DoctorListDto>>> (
                    [AsParameters] GetAllDoctorsQuery query,
                    GetAllDoctorsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var doctors = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(doctors);
                }
            )
            .WithName(nameof(ApiEndpoints.Doctors.GetAll))
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.AnyRole)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
