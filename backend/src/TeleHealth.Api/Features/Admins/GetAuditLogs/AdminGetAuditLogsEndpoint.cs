using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetAuditLogs;

// Maps the admin endpoint for retrieving recent system audit logs.
public static class AdminGetAuditLogsEndpoint
{
    public static void MapAdminGetAuditLogsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetAuditLogs,
                async Task<Ok<PagedResult<AdminAuditLogDto>>> (
                    [AsParameters] AdminGetAuditLogsQuery query,
                    AdminGetAuditLogsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetAuditLogs")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
