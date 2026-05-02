using Destructurama.Attributed;

namespace TeleHealth.Api.Features.Users.ChangePassword;

// Represents the input for changing the signed-in user's password.
public sealed record ChangePasswordCommand(
    [property: NotLogged] string CurrentPassword,
    [property: NotLogged] string NewPassword
);
