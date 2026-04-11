using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;
using TeleHealth.Api.Features.Patients.GetProfile;
using TeleHealth.Api.Features.Patients.UpdateMedicalRecord;

namespace TeleHealth.Api.Features.Patients.RescheduleAppointment;

public static class RescheduleAppointmentEndpoint
{
    public static void MapRescheduleAppointmentEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPut(
                $"{ApiEndpoints.Patients.UpdateAppointmentBySlug}",
                async (
                    [FromRoute] Guid id,
                    ClaimsPrincipal user,
                    RescheduleAppointmentCommand cmd,
                    RescheduleAppointmentHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    await handler.HandleAsync(publicId, id, cmd, ct);
                    return TypedResults.NoContent();
                }
            )
            .WithName(nameof(ApiEndpoints.Patients.UpdateAppointmentBySlug))
            .WithTags(nameof(ApiEndpoints.Patients))
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .AddEndpointFilter<ValidationFilter<RescheduleAppointmentCommand>>();
    }
}
