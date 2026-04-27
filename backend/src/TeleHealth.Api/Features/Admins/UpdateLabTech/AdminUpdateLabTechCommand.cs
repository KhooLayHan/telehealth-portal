using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.UpdateLabTech;

// Carries the editable fields for a lab technician update submitted by the admin.
public sealed record AdminUpdateLabTechCommand(
    string FirstName,
    string LastName,
    string Username,
    string Email,
    string? PhoneNumber,
    char Gender,
    LocalDate DateOfBirth,
    Address? Address
);
