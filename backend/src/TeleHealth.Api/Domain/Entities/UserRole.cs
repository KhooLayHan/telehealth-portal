using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class UserRole
{
    public int UserId { get; init; }
    public int RoleId { get; init; }
    public Instant CreatedAt { get; set; }
}
