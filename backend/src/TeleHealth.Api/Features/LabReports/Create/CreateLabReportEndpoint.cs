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
            .WithName("CreateLabReport")
            .WithTags("LabReports")
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .AddEndpointFilter<ValidationFilter<CreateLabReportCommand>>();
    }
}
