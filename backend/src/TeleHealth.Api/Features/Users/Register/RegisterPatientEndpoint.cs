using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Register;

public static class RegisterPatientEndpoint
{
    public static IEndpointRouteBuilder MapRegisterPatientEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                $"{ApiEndpoints.Auth.SignUpPatient}",
                async (
                    RegisterPatientCommand command,
                    RegisterPatientHandler handler,
                    CancellationToken token
                ) =>
                {
                    var patientId = await handler.HandleAsync(command, token);
                    return Results.Created($"/patients/{patientId}", new { PatientId = patientId });
                }
            )
            .WithName("RegisterPatient")
            .WithTags("Authentication")
            .AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();

        return app;
    }
}
