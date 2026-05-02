using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetSettings;

// Maps the admin endpoint for reading clinic-wide settings.
public static class AdminGetSettingsEndpoint
{
    public static void MapAdminGetSettingsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetSettings,
                async Task<Ok<AdminSettingsDto>> (
                    AdminGetSettingsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetSettings")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
