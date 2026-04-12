using Microsoft.AspNetCore.Http.HttpResults;
using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Login;

public static class LoginEndpoint
{
    public static void MapLoginEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                $"{ApiEndpoints.Auth.Login}",
                async (
                    LoginCommand command,
                    LoginHandler handler,
                    HttpContext httpContext,
                    CancellationToken token
                ) =>
                {
                    await handler.HandleAsync(command, httpContext, token);

                    return TypedResults.Ok(new { Message = "Login successful" });
                }
            )
            .WithName(nameof(ApiEndpoints.Auth.Login))
            .WithTags(nameof(ApiEndpoints.Auth))
            .ProducesProblem(StatusCodes.Status401Unauthorized)
            .AddEndpointFilter<ValidationFilter<LoginCommand>>();
    }
}
