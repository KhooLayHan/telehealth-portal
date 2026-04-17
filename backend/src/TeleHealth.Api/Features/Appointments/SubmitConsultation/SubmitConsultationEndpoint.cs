using System.Security.Claims;

using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.SubmitConsultation;

public static class SubmitConsultationEndpoint
{
    public static void MapSubmitConsultationEndpoint(this RouteGroupBuilder group)
    {
        group
            .MapPost(
                ApiEndpoints.Appointments.SubmitConsultation,
                async Task<Results<Created<SubmitConsultationResponse>, NotFound, Conflict>> (
                    Guid id,
                    SubmitConsultationRequest req,
                    ClaimsPrincipal user,
                    SubmitConsultationHandler handler,
                    CancellationToken ct
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var doctorPublicId))
                        throw new TokenInvalidException();

                    var consultationPublicId = await handler.HandleAsync(
                        id,
                        doctorPublicId,
                        req,
                        ct
                    );
                    return TypedResults.Created(
                        $"/api/consultations/{consultationPublicId}",
                        new SubmitConsultationResponse(consultationPublicId)
                    );
                }
            )
            .WithName("SubmitConsultation")
            .WithTags("Appointments")
            .RequireAuthorization(AuthConstants.DoctorPolicy)
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict);
    }
}

public sealed record SubmitConsultationResponse(Guid ConsultationPublicId);