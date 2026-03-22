using System.ComponentModel.DataAnnotations;
using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Role
{
    public int Id { get; init; }
    public required string Slug { get; init; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required Instant CreatedAt { get; set; }
    public ICollection<User> Users { get; set; } = [];
}
