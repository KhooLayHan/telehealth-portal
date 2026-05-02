using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.SystemSettings.GetPublic;

// Maps the public endpoint for reading non-sensitive system settings.
public static class GetPublicSystemSettingsEndpoint
{
    public static void MapGetPublicSystemSettingsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.SystemSettings.GetPublic,
                async Task<Ok<GetPublicSystemSettingsDto>> (
                    GetPublicSystemSettingsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("GetPublicSystemSettings")
            .WithTags("SystemSettings")
            .AllowAnonymous();
    }
}
