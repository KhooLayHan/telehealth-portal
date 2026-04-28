using Destructurama.Attributed;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.CreateLabTech;

// Represents the admin request for creating a lab technician account.
public sealed record AdminCreateLabTechCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    [property: NotLogged] string Password,
    string? PhoneNumber,
    char Gender,
    LocalDate DateOfBirth,
    [property: NotLogged] string IcNumber,
    Address? Address
);
