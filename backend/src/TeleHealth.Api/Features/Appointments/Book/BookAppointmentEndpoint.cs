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
                async Task<Created<BookAppointmentResponse>> (
                    BookAppointmentCommand command,
                    BookAppointmentHandler handler,
                    ClaimsPrincipal user,
                    CancellationToken token
                ) =>
                {
                    var claimValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
                    if (!Guid.TryParse(claimValue, out var userPublicId))
                    {
                        // Handle invalid GUID (e.g., return BadRequest, throw, etc.)
                        throw new ArgumentException("Invalid user ID.");
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
            .ProducesProblem(StatusCodes.Status404NotFound)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .ProducesProblem(StatusCodes.Status422UnprocessableEntity)
            .AddEndpointFilter<ValidationFilter<BookAppointmentCommand>>();

        return app;
    }
}
