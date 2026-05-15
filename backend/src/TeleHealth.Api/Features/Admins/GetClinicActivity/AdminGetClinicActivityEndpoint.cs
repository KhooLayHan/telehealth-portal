using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetClinicActivity;

// Maps the admin endpoint for serverless-backed clinic activity chart data.
public static class AdminGetClinicActivityEndpoint
{
    public static void MapAdminGetClinicActivityEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetClinicActivity,
                async Task<Ok<IReadOnlyList<AdminClinicActivityDataPointDto>>> (
                    AdminGetClinicActivityHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetClinicActivity")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
