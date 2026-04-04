using TeleHealth.Api.Common;
using TeleHealth.Api.Features.Users.Create;

namespace TeleHealth.Api.Features.Users.Create;

public static class CreateUserEndpoint
{
    public static void MapCreateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost(
                "/users",
                async (
                    CreateUserCommand command,
                    CreateUserHandler handler,
                    CancellationToken token
                ) =>
                {
                    var result = await handler.HandleAsync(command, token);
                    return Results.Ok(result);
                }
            )
            .WithName("CreateUser")
            .WithTags("Users")
            .AddEndpointFilter<ValidationFilter<CreateUserCommand>>();
    }
}
