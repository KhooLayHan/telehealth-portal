using Microsoft.EntityFrameworkCore;
using TeleHealth.Api.Common.Models;
using TeleHealth.Api.Infrastructure.Persistence;

namespace TeleHealth.Api.Features.Admins.GetAuditLogs;

// Queries recent audit log rows without exposing internal IDs or raw audit JSON.
public sealed class AdminGetAuditLogsHandler(ApplicationDbContext db)
{
    private const int MaxPageSize = 25;

    public async Task<PagedResult<AdminAuditLogDto>> HandleAsync(
        AdminGetAuditLogsQuery query,
        CancellationToken ct
    )
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, MaxPageSize);

        var auditLogs = db
            .AuditLogs.AsNoTracking()
            .OrderByDescending(auditLog => auditLog.CreatedAt);
        var totalCount = await auditLogs.CountAsync(ct);

        var rows = await auditLogs
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(auditLog => new
            {
                auditLog.PublicId,
                auditLog.TableName,
                auditLog.Action,
                auditLog.ChangedColumns,
                PerformedByUserPublicId = auditLog.User == null
                    ? null
                    : (Guid?)auditLog.User.PublicId,
                auditLog.PerformedBySystem,
                auditLog.CreatedAt,
            })
            .ToListAsync(ct);

        var items = rows.Select(auditLog => new AdminAuditLogDto(
                auditLog.PublicId,
                auditLog.TableName,
                auditLog.Action,
                auditLog.ChangedColumns,
                BuildSummary(auditLog.Action, auditLog.ChangedColumns),
                auditLog.PerformedByUserPublicId,
                auditLog.PerformedBySystem,
                auditLog.CreatedAt
            ))
            .ToList();

        return new PagedResult<AdminAuditLogDto>(items, totalCount, page, pageSize);
    }

    private static string BuildSummary(string action, string[]? changedColumns)
    {
        return action switch
        {
            "INSERT" => "Created row",
            "DELETE" => "Deleted row",
            "UPDATE" when changedColumns is { Length: > 0 } =>
                $"Updated {changedColumns.Length} column{(changedColumns.Length == 1 ? string.Empty : "s")}",
            "UPDATE" => "Updated row",
            _ => "Recorded audit event",
        };
    }
}
