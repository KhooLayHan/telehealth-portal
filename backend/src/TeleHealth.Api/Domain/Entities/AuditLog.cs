using System.Text.Json;
using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class AuditLog
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string TableName { get; set; }
    public required long RecordId { get; init; }
    public required string Action { get; set; }
    public JsonDocument? OldValues { get; set; }
    public JsonDocument? NewValues { get; set; }
    public List<JsonDocument>? ChangedColumns { get; set; }
    public long? PerformedByUserId { get; set; }
    public bool PerformedBySystem { get; set; }
    public Instant CreatedAt { get; set; }

    public User User { get; } = null!;
}
