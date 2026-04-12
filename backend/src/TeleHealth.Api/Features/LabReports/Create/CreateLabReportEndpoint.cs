using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.LabReports.Create;

public static class CreateLabReportEndpoint
{
    public static void MapCreateLabReportEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                $"{ApiEndpoints.LabReports.Create}",
                async (
                    CreateLabReportCommand cmd,
                    CreateLabReportHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var response = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created(
                        $"{ApiEndpoints.LabReports.Base}/{response.PublicId}",
                        response
                    );
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.Create))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .AddEndpointFilter<ValidationFilter<CreateLabReportCommand>>();
    }
}
