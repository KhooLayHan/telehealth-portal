using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.CancelAppointment;

public static class CancelAppointmentEndpoint
{
    public static void MapCancelAppointmentEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPatch(
                $"{ApiEndpoints.Patients.DeleteAppointmentBySlug}",
                async (
                    [FromRoute] string slug,
                    ClaimsPrincipal user,
                    [FromBody] CancelAppointmentCommand cmd,
                    CancelAppointmentHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    await handler.HandleAsync(publicId, slug, cmd, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.DeleteAppointmentBySlug))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationFilter<CancelAppointmentCommand>>();
    }
}
