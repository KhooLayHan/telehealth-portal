using Microsoft.EntityFrameworkCore;
using Npgsql;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Register;

public static class RegisterPatientEndpoint
{
    public static IEndpointRouteBuilder MapRegisterPatientEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                "/auth/register-patient",
                async (
                    RegisterPatientCommand command,
                    RegisterPatientHandler handler,
                    CancellationToken token
                ) =>
                {
                    try
                    {
                        var patientId = await handler.HandleAsync(command, token);
                        return Results.Created(
                            $"/patients/{patientId}",
                            new { PatientId = patientId }
                        );
                    }
                    catch (InvalidOperationException ex)
                    {
                        return Results.Conflict(new { Error = ex.Message });
                    }
                }
            )
            .WithName("RegisterPatient")
            .WithTags("Authentication")
            .AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();

        return app;
    }
}
