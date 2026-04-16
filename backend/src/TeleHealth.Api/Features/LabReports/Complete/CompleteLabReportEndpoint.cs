using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.LabReports.Complete;

public static class CompleteLabReportEndpoint
{
    public static void MapCompleteLabReportsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                $"{ApiEndpoints.LabReports.UpdateBySlug}",
                async (
                    [FromRoute] string slug,
                    [FromBody] CompleteLabReportCommand cmd,
                    CompleteLabReportHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(slug, cmd, ct);
                    return Results.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.UpdateBySlug))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .AddEndpointFilter<ValidationFilter<CompleteLabReportCommand>>();
    }
}
