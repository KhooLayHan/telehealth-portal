using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.GetAllDepartments;

// Maps the admin endpoint for listing all departments.
public static class AdminGetAllDepartmentsEndpoint
{
    public static void MapAdminGetAllDepartmentsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Admins.GetAllDepartments,
                async Task<Ok<IReadOnlyList<AdminDepartmentDto>>> (
                    AdminGetAllDepartmentsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminGetAllDepartments")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden);
    }
}
