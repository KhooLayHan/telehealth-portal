using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Register;

public static class RegisterPatientEndpoint
{
    public static IEndpointRouteBuilder MapRegisterPatientEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/register-patient", async (RegisterPatientCommand command, RegisterPatientHandler handler, CancellationToken token) => 
        {
            var patientId = await handler.HandleAsync(command, token);
            
            return patientId != null
                ? Results.Created($"/api/v1/patients/{patientId}", new { PatientId = patientId })
                : Results.BadRequest("Failed to register patient.");
        })
        .WithName("RegisterPatient")
        .WithTags("Authentication")
        .AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();
    }
}