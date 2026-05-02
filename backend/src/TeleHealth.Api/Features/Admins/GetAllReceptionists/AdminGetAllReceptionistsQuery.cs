namespace TeleHealth.Api.Features.Admins.GetAllReceptionists;

// Query parameters for paginated receptionist listing
public sealed record AdminGetAllReceptionistsQuery(
    string? Search,
    string? Gender,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
