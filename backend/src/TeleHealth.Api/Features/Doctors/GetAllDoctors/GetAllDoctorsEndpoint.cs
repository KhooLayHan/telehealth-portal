using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Doctors.GetAllDoctors;

public static class GetAllDoctorsEndpoint
{
    public static void MapGetAllDoctorsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Doctors.GetAll}",
                async (GetAllDoctorsHandler handler, CancellationToken ct) =>
                {
                    var doctors = await handler.HandleAsync(ct);
                    return TypedResults.Ok(doctors);
                }
            )
            .WithName(nameof(ApiEndpoints.Doctors.GetAll))
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization()
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
