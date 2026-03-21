using System.ComponentModel.DataAnnotations;
using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public class User
{
    public long Id { get; init; }

    public Guid PublicId { get; init; }

    [StringLength(100)]
    public required string Slug { get; init; }

    [StringLength(50)]
    public required string Username { get; set; }

    [StringLength(255)]
    public required string Email { get; set; }

    [StringLength(255)]
    public required string PasswordHash { get; set; }

    [StringLength(100)]
    public required string FirstName { get; set; }

    [StringLength(100)]
    public required string LastName { get; set; }

    public char Gender { get; set; }

    public LocalDate DateOfBirth { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(12)]
    public required string IcNumber { get; set; }
    
    // public Address? Address { get; set; }

    public Instant CreatedAt { get; set; }

    public Instant? UpdatedAt { get; set; }

    public Instant? DeletedAt { get; set; }

    public ICollection<Role> Roles { get; set; } = null!;
}
