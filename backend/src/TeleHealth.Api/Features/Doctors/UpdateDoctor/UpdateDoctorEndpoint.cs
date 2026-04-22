using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.UpdateDoctor;

public static class UpdateDoctorEndpoint
{
    public static void MapUpdateDoctorEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Doctors.UpdateById,
                async (
                    [FromRoute] Guid id,
                    [FromBody] UpdateDoctorCommand cmd,
                    UpdateDoctorHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(id, cmd, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("UpdateDoctorById")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<UpdateDoctorCommand>>();
    }
}
