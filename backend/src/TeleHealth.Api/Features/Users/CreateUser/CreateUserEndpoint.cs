using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.CreateUser;

public static class CreateUserEndpoint
{
    public static void MapCreateUserEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/users", async (CreateUserCommand command, CreateUserHandler handler, CancellationToken token) =>
        {
            var result = await handler.HandleAsync(command, token);
            return Results.Ok(result);
        })
        .WithName("CreateUser")
        .WithTags("Users")
        .AddEndpointFilter<ValidationFilter<CreateUserCommand>>(); 
    }
}