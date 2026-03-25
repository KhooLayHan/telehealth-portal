using NodaTime;

namespace TeleHealth.Api.Features.Users.CreateUser;

public record CreateUserCommand(
    string Username,
    string Email,
    string Password,
    string FirstName,
    string LastName,
    char Gender,
    LocalDate DateOfBirth,
    string Phone,
    string IcNumber
) { }
