using System.Security.Claims;
using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Appointments.Book;

public sealed record BookAppointmentResponse(Guid AppointmentPublicId);

public static class BookAppointmentEndpoint
{
    public static IEndpointRouteBuilder MapBookAppointmentEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                ApiEndpoints.Appointments.Book,
                async Task<Results<Created<BookAppointmentResponse>, UnauthorizedHttpResult>> (
                    BookAppointmentCommand command,
                    BookAppointmentHandler handler,
                    ClaimsPrincipal user,
                    CancellationToken token
                ) =>
                {
                    var nameIdentifier = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(nameIdentifier, out var userPublicId))
                    {
                        return TypedResults.Unauthorized();
                    }

                    var result = await handler.HandleAsync(userPublicId, command, token);

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
            .WithTags("Appointments")
            .RequireAuthorization("PatientOnly")
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .ProducesProblem(StatusCodes.Status403Forbidden)
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationFilter<BookAppointmentCommand>>();

        return app;
    }
}
