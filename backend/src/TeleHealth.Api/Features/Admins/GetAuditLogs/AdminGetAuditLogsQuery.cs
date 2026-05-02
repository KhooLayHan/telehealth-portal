namespace TeleHealth.Api.Features.Admins.GetAuditLogs;

// Query parameters for the paginated admin audit log feed.
public sealed record AdminGetAuditLogsQuery(int Page = 1, int PageSize = 5);
