namespace TeleHealth.Api.Features.Admins.GetAllReceptionists;

// Query parameters for paginated receptionist listing
public sealed record AdminGetAllReceptionistsQuery(
    string? Search,
    int Page = 1,
    int PageSize = 10,
    string? SortOrder = "asc"
);
