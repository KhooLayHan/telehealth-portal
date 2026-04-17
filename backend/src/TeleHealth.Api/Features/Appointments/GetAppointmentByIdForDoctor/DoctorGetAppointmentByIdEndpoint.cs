using System.Security.Claims;

using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.GetAppointmentByIdForDoctor;

public static class DoctorGetAppointmentByIdEndpoint
{
    public static void MapGetAppointmentByIdForDoctorEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Appointments.GetByIdForDoctor,
                async Task<Results<Ok<DoctorAppointmentDetailDto>, NotFound>> (
                    Guid id,
                    ClaimsPrincipal user,
                    DoctorGetAppointmentByIdHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var doctorPublicId))
                        throw new TokenInvalidException();

                    var appointment = await handler.HandleAsync(id, doctorPublicId, ct);
                    return appointment is null
                        ? TypedResults.NotFound()
                        : TypedResults.Ok(appointment);
                }
            )
            .WithName("GetAppointmentByIdForDoctor")
            .WithTags("Appointments")
            .RequireAuthorization(AuthConstants.DoctorPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}