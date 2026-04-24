using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.DeletePatient;

public static class DeletePatientEndpoint
{
    public static void MapDeletePatientEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Patients.SoftDeleteById,
                async (Guid patientPublicId, DeletePatientHandler handler, CancellationToken ct) =>
                {
                    await handler.HandleAsync(patientPublicId, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.SoftDeleteById))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
