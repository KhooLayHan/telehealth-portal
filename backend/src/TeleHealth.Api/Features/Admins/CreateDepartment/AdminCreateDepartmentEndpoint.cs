using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Admins.GetAllDepartments;

namespace TeleHealth.Api.Features.Admins.CreateDepartment;

// Maps the admin endpoint for creating departments.
public static class AdminCreateDepartmentEndpoint
{
    public static void MapAdminCreateDepartmentEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Admins.CreateDepartment,
                async Task<Created<AdminDepartmentDto>> (
                    AdminCreateDepartmentCommand cmd,
                    AdminCreateDepartmentHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var result = await handler.HandleAsync(cmd, ct);
                    return TypedResults.Created(
                        $"/api/v1/admins/departments/{result.Slug}",
                        result
                    );
                }
            )
            .WithName("AdminCreateDepartment")
            .WithTags("Admins")
            .RequireAuthorization(AuthConstants.AdminPolicy)
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<AdminCreateDepartmentCommand>>();
    }
}
