using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetSettings;

namespace TeleHealth.Api.Features.Admins.UpdateSettings;

// Maps the admin endpoint for updating clinic-wide settings.
public static class AdminUpdateSettingsEndpoint
{
    public static void MapAdminUpdateSettingsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Admins.UpdateSettings,
                async Task<Ok<AdminSettingsDto>> (
                    AdminUpdateSettingsCommand cmd,
                    AdminUpdateSettingsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminUpdateSettings")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminUpdateSettingsCommand>>();
    }
}
