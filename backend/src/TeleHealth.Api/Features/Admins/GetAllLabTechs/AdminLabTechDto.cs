using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.GetAllLabTechs;

// Response DTO for a single lab technician record returned to the admin
public sealed record AdminLabTechDto
{
    public Guid PublicId { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? PhoneNumber { get; init; }
    public required string Slug { get; init; }
    public required char Gender { get; init; }
    public LocalDate DateOfBirth { get; init; }
    public string? AvatarUrl { get; init; }
    public Address? Address { get; init; }
    public Instant CreatedAt { get; init; }
    public Instant? DeletedAt { get; init; }
}
