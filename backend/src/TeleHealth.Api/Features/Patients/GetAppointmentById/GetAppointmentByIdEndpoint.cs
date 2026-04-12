using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetAllAppointments;

namespace TeleHealth.Api.Features.Patients.GetAppointmentById;

public static class GetAppointmentByIdEndpoint
{
    public static void MapGetAppointmentByIdEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Patients.GetAppointmentByIdOrSlug}",
                async Task<Ok<AppointmentDto>> (
                    string idOrSlug,
                    ClaimsPrincipal user,
                    GetAppointmentByIdHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    var appointments = await handler.HandleAsync(publicId, idOrSlug, ct);
                    return TypedResults.Ok(appointments);
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.GetAppointmentByIdOrSlug))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
