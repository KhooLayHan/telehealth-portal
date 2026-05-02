using Destructurama.Attributed;
using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.UpdateReceptionist;

// Carries the editable fields for a receptionist update submitted by the admin
public sealed record AdminUpdateReceptionistCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    [property: NotLogged] string IcNumber,
    string? PhoneNumber,
    char Gender,
    LocalDate DateOfBirth,
    Address? Address
);
