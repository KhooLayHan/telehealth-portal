using Destructurama.Attributed;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.CreateReceptionist;

public sealed record AdminCreateReceptionistCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    [property: NotLogged] string Password,
    string? PhoneNumber,
    char Gender,
    LocalDate DateOfBirth,
    string IcNumber,
    Address? Address
);
