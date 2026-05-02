using NodaTime;

namespace TeleHealth.Api.Features.Users.UpdateProfile;

public sealed record UpdateProfileCommand(
    string FirstName,
    string LastName,
    string? Phone,
    string IcNumber,
    string? Address,
    string? Username,
    LocalDate? DateOfBirth,
    string? Gender,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? State,
    string? PostalCode,
    string? Country
);
