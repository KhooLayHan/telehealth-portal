using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetDashboardSummary;

// Maps the admin endpoint for retrieving dashboard summary counts.
public static class AdminGetDashboardSummaryEndpoint
{
    public static void MapAdminGetDashboardSummaryEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetDashboardSummary,
                async Task<Ok<AdminDashboardSummaryDto>> (
                    AdminGetDashboardSummaryHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetDashboardSummary")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
