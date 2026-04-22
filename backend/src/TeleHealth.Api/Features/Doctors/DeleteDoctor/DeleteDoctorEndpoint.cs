using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.DeleteDoctor;

public static class DeleteDoctorEndpoint
{
    public static void MapDeleteDoctorEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Doctors.SoftDeleteById,
                async ([FromRoute] Guid id, DeleteDoctorHandler handler, CancellationToken ct) =>
                {
                    await handler.HandleAsync(id, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("DeleteDoctorById")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
