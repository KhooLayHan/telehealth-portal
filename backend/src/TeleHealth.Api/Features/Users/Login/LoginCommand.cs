using Destructurama.Attributed;

namespace TeleHealth.Api.Features.Users.Login;

public sealed record LoginCommand(string Email, [property: NotLogged] string Password) { }