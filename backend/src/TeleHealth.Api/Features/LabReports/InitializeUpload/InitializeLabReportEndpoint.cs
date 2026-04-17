using Microsoft.AspNetCore.Mvc;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.LabReports.InitializeUpload;

public static class InitializeLabReportEndpoint
{
    public static void MapInitializeLabReportEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                $"{ApiEndpoints.LabReports.Create}",
                async (
                    InitializeLabReportCommand cmd,
                    InitializeLabReportHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var response = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created(
                        $"{ApiEndpoints.LabReports.Create}/{response.PublicId}",
                        response
                    );
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.Create))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .Produces<InitializeLabReportResponse>(StatusCodes.Status201Created)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .AddEndpointFilter<ValidationFilter<InitializeLabReportCommand>>();
    }
}