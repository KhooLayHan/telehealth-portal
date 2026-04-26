using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Admins.DeleteDepartment;

// Maps the admin PATCH endpoint for soft-deleting a department.
public static class AdminDeleteDepartmentEndpoint
{
    public static void MapAdminDeleteDepartmentEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                ApiEndpoints.Admins.DeleteDepartment,
                async Task<NoContent> (
                    string slug,
                    AdminDeleteDepartmentHandler handler,
                    CancellationToken ct
                ) =>
                {
                    await handler.HandleAsync(slug, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName("AdminDeleteDepartment")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}
