using System.Security.Claims;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;

namespace TeleHealth.Api.Features.LabReports.Download;

public sealed record LabReportDownloadResponse(string DownloadUrl);

public static class DownloadLabReportEndpoint
{
    public static void MapDownloadLabReportEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.LabReports.GetBySlug}",
                async (
                    string slug,
                    DownloadLabReportHandler handler,
                    ClaimsPrincipal user,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    var role = user.FindFirstValue(ClaimTypes.Role) ?? "";

                    var downloadUrl = await handler.HandleAsync(slug, publicId, role, ct);

                    return TypedResults.Ok(new LabReportDownloadResponse(downloadUrl));
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.GetBySlug))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization()
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
