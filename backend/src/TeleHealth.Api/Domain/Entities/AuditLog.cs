using System.Text.Json;
using NodaTime;

namespace TeleHealth.Api.Domain.Entities;

public sealed class AuditLog : IDisposable
{
    public long Id { get; init; }
    public Guid PublicId { get; init; }
    public required string TableName { get; set; }
    public required long RecordId { get; init; }
    public required string Action { get; set; }
    public JsonDocument? OldValues { get; set; }
    public JsonDocument? NewValues { get; set; }
    public string[]? ChangedColumns { get; set; }
    public JsonDocument? Metadata { get; set; }
    public long? PerformedByUserId { get; set; }
    public bool PerformedBySystem { get; set; }
    public Instant CreatedAt { get; set; }
    public User? User { get; }

    public void Dispose()
    {
        OldValues?.Dispose();
        NewValues?.Dispose();
        Metadata?.Dispose();
    }
}
