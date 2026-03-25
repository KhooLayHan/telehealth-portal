using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class Notification
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required long RecipientUserId { get; init; }
    public required string Type { get; set; }
    public required string Channel { get; set; }
    public string? Subject { get; set; }
    public required string Body { get; set; }
    public string? RelatedEntityType { get; set; }
    public long? RelatedEntityId { get; set; }
    public string? SnsMessageId { get; set; }
    public required string Status { get; set; }
    public Instant? SendAt { get; set; }
    public string? ErrorMessage { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public User? User { get; } = null!;
}
