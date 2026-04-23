using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.CreateDoctor;

public static class CreateDoctorEndpoint
{
    public static void MapCreateDoctorEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Doctors.CreateDoctor,
                async (
                    CreateDoctorCommand cmd,
                    CreateDoctorHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var doctorPublicId = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created($"/api/v1/doctors/{doctorPublicId}");
                }
            )
            .WithName("CreateDoctor")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<CreateDoctorCommand>>();
    }
}
