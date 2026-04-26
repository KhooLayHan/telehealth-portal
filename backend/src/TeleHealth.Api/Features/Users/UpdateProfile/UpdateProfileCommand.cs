namespace TeleHealth.Api.Features.Users.UpdateProfile;

public sealed record UpdateProfileCommand(
    string FirstName,
    string LastName,
    string? Phone,
    string IcNumber,
    string? Address
);
