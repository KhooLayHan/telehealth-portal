using NodaTime;

namespace TeleHealth.Api.Features.Users.Register;

public sealed record RegisterPatientCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string IcNumber,
    char Gender,
    LocalDate DateOfBirth
) { }