using Destructurama.Attributed;

using NodaTime;

namespace TeleHealth.Api.Features.Users.Create;

public sealed record CreateUserCommand(
    string Username,
    string Email,
    [property: NotLogged] string Password,
    string FirstName,
    string LastName,
    string Gender,
    LocalDate DateOfBirth,
    string Phone,
    string IcNumber
)
{ }