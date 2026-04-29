using NodaTime;

namespace TeleHealth.Api.Features.Admins.GetAuditLogs;

// Response DTO for a privacy-safe audit log row shown on the admin dashboard.
public sealed record AdminAuditLogDto(
    Guid PublicId,
    string TableName,
    string Action,
    string[]? ChangedColumns,
    string Summary,
    Guid? PerformedByUserPublicId,
    bool PerformedBySystem,
    Instant CreatedAt
);
