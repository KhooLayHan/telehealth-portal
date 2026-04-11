using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Patients.GetAllAppointments;

public static class GetAllAppointmentsEndpoint
{
    public static void MapGetAllAppointmentsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                $"{ApiEndpoints.Patients.GetAllAppointments}",
                async Task<Ok<PagedResult<AppointmentDto>>> (
                    [AsParameters] GetAllAppointmentsQuery query,
                    ClaimsPrincipal user,
                    GetAllAppointmentsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    var appointments = await handler.HandleAsync(publicId, query, ct);
                    return TypedResults.Ok(appointments);
                }
            )
            .WithName("GetMyAppointments")
            .WithTags("Patients")
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized);
    }
}
