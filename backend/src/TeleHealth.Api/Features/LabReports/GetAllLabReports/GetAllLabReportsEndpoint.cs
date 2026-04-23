using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.LabReports.GetAllLabReports;

public static class GetAllLabReportsEndpoint
{
    public static void MapGetAllLabReportsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.LabReports.GetAll,
                async Task<Ok<PagedResult<LabReportDto>>> (
                    [AsParameters] GetAllLabReportsQuery query,
                    GetAllLabReportsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var reports = await handler.HandleAsync(query, ct);
                    return TypedResults.Ok(reports);
                }
            )
            .WithName(nameof(ApiEndpoints.LabReports.GetAll))
            .WithTags(nameof(ApiEndpoints.LabReports))
            .RequireAuthorization(AuthConstants.LabTechPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
