using System.ComponentModel.DataAnnotations;

namespace TeleHealth.Api.Domain.Entities;

public class Role
{
    public int Id { get; init; }

    [StringLength(50)]
    public required string Slug { get; init; }

    [StringLength(100)]
    public required string Name { get; set; }

    [StringLength(255)]
    public string? Description { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<User> Users { get; set; } = null!;
}
