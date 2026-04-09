using System.Security.Claims;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Appointments.Book;

public static class BookAppointmentEndpoint
{
    public static IEndpointRouteBuilder MapBookAppointmentEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                ApiEndpoints.Appointments.Book,
                async (
                    BookAppointmentCommand command,
                    BookAppointmentHandler handler,
                    ClaimsPrincipal user,
                    CancellationToken token
                ) =>
                {
                    var userPublicId = Guid.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

                    var result = await handler.HandleAsync(userPublicId, command, token);

                    return result is null
                        ? Results.NotFound()
                        : Results.Created(
                            ApiEndpoints.Appointments.GetById.Replace(
                                "{id:guid}",
                                result.AppointmentPublicId.ToString()
                            ),
                            new { result.AppointmentPublicId }
                        );
                }
            )
            .WithName("BookAppointment")
            .WithTags("Appointments")
            .RequireAuthorization("PatientOnly")
            .AddEndpointFilter<ValidationFilter<BookAppointmentCommand>>();

        return app;
    }
}
