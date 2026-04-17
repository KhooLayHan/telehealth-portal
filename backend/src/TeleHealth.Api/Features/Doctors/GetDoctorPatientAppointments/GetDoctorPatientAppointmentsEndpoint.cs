using System.Security.Claims;

using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Doctors.GetDoctorPatientAppointments;

public static class GetDoctorPatientAppointmentsEndpoint
{
    public static void MapGetDoctorPatientAppointmentsEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapGet(
                ApiEndpoints.Doctors.GetPatientAppointments,
                async Task<Results<Ok<GetDoctorPatientAppointmentsResponse>, NotFound>> (
                    Guid patientPublicId,
                    ClaimsPrincipal user,
                    GetDoctorPatientAppointmentsHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                        throw new TokenInvalidException();

                    var result = await handler.HandleAsync(publicId, patientPublicId, ct);
                    if (result is null)
                        return TypedResults.NotFound();

                    return TypedResults.Ok(result);
                }
            )
            .WithName("GetDoctorPatientAppointments")
            .WithTags(nameof(ApiEndpoints.Doctors))
            .RequireAuthorization(AuthConstants.DoctorPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound);
    }
}