using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class User
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string Slug { get; init; }
    public required string Username { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? AvatarUrl { get; set; }
    public required char Gender { get; set; }
    public LocalDate DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public required string IcNumber { get; set; }
    public Address? Address { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public Instant? DeletedAt { get; set; }
    public ICollection<Role> Roles { get; } = [];
    public ICollection<UserRole> UserRoles { get; } = [];
    public Doctor? Doctor { get; } = null!;
    public Patient? Patient { get; } = null!;
    public ICollection<Appointment>? Appointments { get; } = [];
    public ICollection<Notification>? Notifications { get; } = [];
    public AuditLog? AuditLog { get; } = null!;
}
