using Microsoft.AspNetCore.Http.HttpResults;
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
                    var result = await handler.HandleAsync(command, token);

                    return TypedResults.Created(
                        $"{ApiEndpoints.Patients.GetById.Replace("{id:guid}", result.PatientPublicId.ToString())}",
                        new { result.UserPublicId, result.PatientPublicId }
                    );
                }
            )
            .WithName(nameof(ApiEndpoints.Auth.SignUpPatient))
            .WithTags(nameof(ApiEndpoints.Auth))
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationFilter<RegisterPatientCommand>>();

        return app;
    }
}
