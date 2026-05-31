using TeleHealth.Api.Common;

namespace TeleHealth.Api.Features.Users.Login;

public static class LogoutEndpoint
{
    public static void MapLogoutEndpoint(this RouteGroupBuilder app)
    {
        app.MapPost(
                ApiEndpoints.Auth.Logout,
                (HttpContext httpContext) =>
                {
                    httpContext.Response.Cookies.Delete(
                        "X-Access-Token",
                        new CookieOptions
                        {
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.None,
                        }
                    );

                    return TypedResults.Ok(new { Message = "Logged out" });
                }
            )
            .WithName(nameof(ApiEndpoints.Auth.Logout))
            .WithTags(nameof(ApiEndpoints.Auth));
    }
}
