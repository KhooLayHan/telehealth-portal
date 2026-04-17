using Microsoft.AspNetCore.Http.HttpResults;

using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Create;

public static class CreateUserEndpoint
{
    public static void MapCreateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost(
                $"{ApiEndpoints.Patients.Create}",
                async (
                    CreateUserCommand command,
                    CreateUserHandler handler,
                    CancellationToken token
                ) =>
                {
                    var result = await handler.HandleAsync(command, token);
                    return TypedResults.Ok(result);
                }
            )
            .WithName("CreateUser")
            .WithTags("Users")
            .ProducesProblem(StatusCodes.Status400BadRequest)
            .ProducesProblem(StatusCodes.Status409Conflict)
            .AddEndpointFilter<ValidationFilter<CreateUserCommand>>();
    }
}