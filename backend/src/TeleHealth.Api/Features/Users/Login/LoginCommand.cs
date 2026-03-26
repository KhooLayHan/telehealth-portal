namespace TeleHealth.Api.Features.Users.Login;

public class LoginCommand
{
    public sealed record LoginCommand(
        string Email,
        [NotLogged] string Password
    );
}