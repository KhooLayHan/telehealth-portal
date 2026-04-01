using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Login;

public static class LoginEndpoint
{
    public static void MapLoginEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                "/auth/login",
                async (
                    LoginCommand command,
                    LoginHandler handler,
                    HttpContext httpContext,
                    CancellationToken token
                ) =>
                {
                    var success = await handler.HandleAsync(command, httpContext, token);

                    return success
                        ? Results.Ok(new { Message = "Login successful" })
                        : Results.Unauthorized();
                }
            )
            .WithName("LoginUser")
            .WithTags("Authentication")
            .AddEndpointFilter<ValidationFilter<LoginCommand>>();
    }
}
