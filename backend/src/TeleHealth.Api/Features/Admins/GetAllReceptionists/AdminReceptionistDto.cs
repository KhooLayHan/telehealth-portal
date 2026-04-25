using NodaTime;
using TeleHealth.Api.Domain.Entities;

namespace TeleHealth.Api.Features.Admins.GetAllReceptionists;

// Response DTO for a single receptionist record returned to the admin
public sealed record AdminReceptionistDto
{
    public Guid PublicId { get; init; }
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public required string Username { get; init; }
    public required string Email { get; init; }
    public string? PhoneNumber { get; init; }
    public required string Slug { get; init; }
    public required string IcNumber { get; init; }
    public required char Gender { get; init; }
    public LocalDate DateOfBirth { get; init; }
    public string? AvatarUrl { get; init; }
    public Address? Address { get; init; }
    public Instant CreatedAt { get; init; }
    public Instant? DeletedAt { get; init; }
}
