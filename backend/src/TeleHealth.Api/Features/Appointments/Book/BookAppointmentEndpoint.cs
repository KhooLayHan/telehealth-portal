using System.Security.Claims;

using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;
using TeleHealth.Api.Common.Exceptions.Auth;
using TeleHealth.Api.Common.Security;

namespace TeleHealth.Api.Features.Appointments.Book;

public sealed record BookAppointmentResponse(Guid AppointmentPublicId);

public static class BookAppointmentEndpoint
{
    public static IEndpointRouteBuilder MapBookAppointmentEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                ApiEndpoints.Appointments.Create,
                async Task<Created<BookAppointmentResponse>> (
                    BookAppointmentCommand command,
                    BookAppointmentHandler handler,
                    ClaimsPrincipal user,
                    CancellationToken token
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var publicId))
                    {
                        throw new TokenInvalidException();
                    }

                    var result = await handler.HandleAsync(publicId, command, token);

                    return TypedResults.Created(
                        ApiEndpoints.Appointments.GetById.Replace(
                            "{id:guid}",
                            result.AppointmentPublicId.ToString()
                        ),
                        new BookAppointmentResponse(result.AppointmentPublicId)
                    );
                }
            )
            .WithName("BookAppointment")
            .WithTags(nameof(ApiEndpoints.Appointments))
            .RequireAuthorization(AuthConstants.PatientPolicy)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<BookAppointmentCommand>>();

        return app;
    }
}