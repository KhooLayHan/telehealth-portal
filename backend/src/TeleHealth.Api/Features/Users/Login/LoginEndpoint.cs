using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Login;

public static class LoginEndpoint
{
    public static void MapLoginEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/v1/auth/login", async (LoginCommand command, LoginHandler handler, CancellationToken token) =>
        {
            var success = await handler.HandleAsync(command, token);
            
            return success 
                ? Results.Ok(new { Message = "Login successful" }) 
                : Results.Unauthorized();
        })
        .WithName("LoginUser")
        .WithTags("Authentication")
        .AddEndpointFilter<ValidationFilter<LoginCommand>>();
    }
}