using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllDepartments;

namespace TeleHealth.Api.Features.Admins.UpdateDepartment;

// Maps the admin PUT endpoint for updating an existing department.
public static class AdminUpdateDepartmentEndpoint
{
    public static void MapAdminUpdateDepartmentEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                ApiEndpoints.Admins.UpdateDepartment,
                async Task<Ok<AdminDepartmentDto>> (
                    string slug,
                    AdminUpdateDepartmentCommand cmd,
                    AdminUpdateDepartmentHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(slug, cmd, ct);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("AdminUpdateDepartment")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminUpdateDepartmentCommand>>();
    }
}
